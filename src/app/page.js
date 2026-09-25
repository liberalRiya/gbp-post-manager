"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./dashboard.css";
import { supabase } from "./lib/supabase/client";

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Locations", icon: "⌖" },
  { name: "Create Post", icon: "＋" },
  { name: "All Posts", icon: "▤" },
];

export default function Home() {
  const router = useRouter();
const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {
  let isMounted = true;

  async function checkSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error || !session) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);
    } catch (err) {
      console.error("Session check failed:", err);

      if (isMounted) {
        router.replace("/login");
      }
    }
  }

  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      router.replace("/login");
    }
  });

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, [router]);
  const [activePage, setActivePage] = useState("Dashboard");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [postTopic, setPostTopic] = useState("");
  const [postType, setPostType] = useState("What's New");
  const [postTone, setPostTone] = useState("Professional");
  const [postLanguage, setPostLanguage] = useState("English");
  const [postCTA, setPostCTA] = useState("Learn More");
  const [postContent, setPostContent] = useState("");
  const [postStatus, setPostStatus] = useState("");

  const [posts, setPosts] = useState([]);
  const [postFilter, setPostFilter] = useState("All");
  const [postSearch, setPostSearch] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  
useEffect(() => {
  const loadWorkspaceData = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Redirect if there is no active session.
    if (authError || !user) {
      router.replace("/login");
      return;
    }

    // Load locations.
    const { data: locationRows, error: locationError } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", user.id);

    if (locationError) {
      console.error("Error loading locations:", locationError.message);
      return;
    }

    setLocations(locationRows || []);

    // Load posts.
    const { data: postRows, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Error loading posts:", postError.message);
      return;
    }

    // Format posts for the dashboard.
    const formattedPosts = (postRows || []).map((post) => {
      const location = (locationRows || []).find(
        (item) => item.id === post.location_id
      );

      return {
        id: post.id,
        locationId: post.location_id,
        businessName: location?.name || "Business location",
        topic: post.topic || "",
        type: post.post_type || "What's New",
        tone: post.tone || "Professional",
        language: post.language || "English",
        cta: post.cta || "",
        content: post.content || "",
        status: post.status || "Draft",
        updatedAt: post.updated_at || post.created_at || "",
      };
    });

    setPosts(formattedPosts);
  };

  loadWorkspaceData();
}, []);

  function generateDemoContent() {
    if (!postTopic.trim()) {
      alert("Please enter a post topic first.");
      return;
    }

    const businessName = selectedLocation
      ? selectedLocation.name
      : "Your Business";

    const generatedText =
      `${postTopic.trim()}\n\n` +
      `Visit ${businessName} and discover what we have to offer. ` +
      `We look forward to welcoming you. Contact us to learn more!`;

    setPostContent(generatedText);
    setPostStatus("Content suggestion generated.");
  }

  async function savePostToSupabase(status) {
  if (!selectedLocation) {
    alert("Please select a business location.");
    return;
  }

  if (!postTopic.trim() || !postContent.trim()) {
    alert("Please enter a topic and post content.");
    return;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("Please log in again before saving.");
    return;
  }

  const now = new Date().toISOString();

  const postData = {
    user_id: user.id,
    location_id: selectedLocation.id,
    topic: postTopic.trim(),
    post_type: postType,
    tone: postTone,
    language: postLanguage,
    cta: postCTA,
    content: postContent.trim(),
    status,
    updated_at: now,
  };

  let result;

  if (editingPostId) {
    result = await supabase
      .from("posts")
      .update(postData)
      .eq("id", editingPostId)
      .eq("user_id", user.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("posts")
      .insert({
        ...postData,
        created_at: now,
      })
      .select()
      .single();
  }

  if (result.error) {
    console.error("Supabase save error:", result.error.message);
    alert("Could not save post: " + result.error.message);
    return;
  }

  const savedRow = result.data;

  const formattedPost = {
    id: savedRow.id,
    locationId: savedRow.location_id,
    businessName: selectedLocation.name,
    topic: savedRow.topic,
    type: savedRow.post_type,
    tone: savedRow.tone,
    language: savedRow.language,
    cta: savedRow.cta,
    content: savedRow.content,
    status: savedRow.status,
    updatedAt: savedRow.updated_at,
  };

  setPosts((currentPosts) =>
    editingPostId
      ? currentPosts.map((post) =>
          post.id === editingPostId ? formattedPost : post
        )
      : [formattedPost, ...currentPosts]
  );

  setPostStatus(
    status === "Draft"
      ? "Draft saved to Supabase."
      : "Post status saved to Supabase. It has not been published to Google."
  );

  setEditingPostId(null);
  setActivePage("All Posts");
}

async function handleSaveDraft() {
  await savePostToSupabase("Draft");
}

async function handlePublish() {
  await savePostToSupabase("Published");
}

  function handleEditPost(post) {
    const location = locations.find(
      (item) => item.id === post.locationId
    );

    setSelectedLocation(location || null);
    setPostTopic(post.topic);
    setPostType(post.type);
    setPostTone(post.tone);
    setPostLanguage(post.language);
    setPostCTA(post.cta);
    setPostContent(post.content);
    setEditingPostId(post.id);
    setPostStatus("");
    setActivePage("Create Post");
  }
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  router.replace("/login");
  router.refresh();
};
  async function handleDeletePost(postId) {
  const shouldDelete = window.confirm(
    "Are you sure you want to delete this post?"
  );

  if (!shouldDelete) return;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("Please log in again before deleting.");
    return;
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete error:", error.message);
    alert("Could not delete post: " + error.message);
    return;
  }

  setPosts((currentPosts) =>
    currentPosts.filter((post) => post.id !== postId)
  );
}
  async function handleStatusChange(postId, newStatus) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("Please log in again before changing the post status.");
    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("posts")
    .update({
      status: newStatus,
      updated_at: now,
    })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Status update error:", error.message);
    alert("Could not update status: " + error.message);
    return;
  }

  setPosts((currentPosts) =>
    currentPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            status: newStatus,
            updatedAt: now,
          }
        : post
    )
  );
}

  function startNewPost() {
    setSelectedLocation(null);
    setPostTopic("");
    setPostType("What's New");
    setPostTone("Professional");
    setPostLanguage("English");
    setPostCTA("Learn More");
    setPostContent("");
    setEditingPostId(null);
    setPostStatus("");
    setActivePage("Create Post");
  }

  function openCreatePost(location) {
    setSelectedLocation(location);
    setPostTopic("");
    setPostType("What's New");
    setPostTone("Professional");
    setPostLanguage("English");
    setPostCTA("Learn More");
    setPostContent("");
    setEditingPostId(null);
    setPostStatus("");
    setActivePage("Create Post");
  }

  const filteredPosts = posts.filter((post) => {
    const matchesFilter =
      postFilter === "All" || post.status === postFilter;

    const searchText = postSearch.toLowerCase();

    const matchesSearch =
      post.topic.toLowerCase().includes(searchText) ||
      post.businessName.toLowerCase().includes(searchText) ||
      post.content.toLowerCase().includes(searchText);

    return matchesFilter && matchesSearch;
  });
if (authChecking) {
  return (
    <div className="auth-loading">
      Checking your session...
    </div>
  );
}
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">G</div>
          <div>
            <h2>GBP Manager</h2>
            <span>AI-powered workspace</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">BU</div>
          <div className="profile-info">
            <strong>Business User</strong>
            <span>Workspace account</span>
          </div>
          <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
>
          ↗
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>
            <span className="account-label">Demo Workspace</span>
            <div className="small-avatar">BU</div>
          </div>
        </header>

        <section className="page-content">
          
          {activePage === "Dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Dashboard</h1>
                  <p className="subtitle">
                    Manage your Google Business Profile content in one place.
                  </p>
                </div>
<button
  className="logout-button"
  onClick={handleLogout}
>
  ↗
</button>
                <button
                  className="primary-button"
                  onClick={() => openCreatePost(null)}
                >
                  ＋ Create New Post
                </button>
              </div>

              <div className="stats-grid">
                <StatCard
                  title="Total Locations"
                  value={String(locations.length)}
                  note="Business locations"
                  icon="⌖"
                />
                <StatCard
                  title="Total Posts"
                  value={String(posts.length)}
                  note="All created posts"
                  icon="▤"
                />
                <StatCard
                  title="Draft Posts"
                  value={String(
                    posts.filter((post) => post.status === "Draft").length
                  )}
                  note="Waiting for publishing"
                  icon="◷"
                />
                <StatCard
                  title="Published Posts"
                  value={String(
                    posts.filter((post) => post.status === "Published").length
                  )}
                  note="Marked as published"
                  icon="✓"
                />
              </div>

              <div className="content-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent Posts</h2>
                      <p>Your latest business updates</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("All Posts")}
                    >
                      View all →
                    </button>
                  </div>

                  {posts.length === 0 ? (
                    <p className="subtitle">
                      No posts yet. Create your first post to see it here.
                    </p>
                  ) : (
                    posts.slice(0, 3).map((post) => (
                      <PostRow
                        key={post.id}
                        title={post.topic}
                        business={`${post.businessName} · Pune`}
                        status={post.status}
                      />
                    ))
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Quick Actions</h2>
                      <p>Get started with your content</p>
                    </div>
                  </div>

                  <button
                    className="action-card"
                    onClick={() => openCreatePost(null)}
                  >
                    <div className="action-icon">✦</div>
                    <div>
                      <strong>Generate with AI</strong>
                      <p>Create engaging business post content.</p>
                    </div>
                    <span>→</span>
                  </button>

                  <button
                    className="action-card"
                    onClick={() => setActivePage("Locations")}
                  >
                    <div className="action-icon location-action">⌖</div>
                    <div>
                      <strong>Manage Locations</strong>
                      <p>View your business locations.</p>
                    </div>
                    <span>→</span>
                  </button>

                  <div className="tip-box">
                    <span>✧</span>
                    <div>
                      <strong>Content tip</strong>
                      <p>
                        Keep your business updates clear, useful, and relevant
                        to your customers.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {activePage === "Locations" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">BUSINESS WORKSPACE</p>
                  <h1>Locations</h1>
                  <p className="subtitle">
                    View and manage your business locations.
                  </p>
                </div>
              </div>

              <div className="location-count">
                <strong>{locations.length} Locations</strong>
                <span>Business locations in your workspace</span>
              </div>

              <div className="location-notice">
              These are the business locations saved in your workspace.
              </div>

              <div className="locations-grid">
                {locations.map((location) => (
                  <article className="location-card" key={location.id}>
                    <div className="location-card-top">
                      <div className="location-icon">⌖</div>
                      <span className="location-tag">Saved</span>
                    </div>

                    <h2>{location.name}</h2>
                    <p className="location-detail">{location.category}</p>
                    <p className="location-detail">
                      {location.address}, {location.city}
                    </p>

                    <button
                      className="location-button"
                      onClick={() => openCreatePost(location)}
                    >
                      Create Post for this Location →
                    </button>
                  </article>
                ))}
              </div>

              <div className="next-step-box">
                <strong>Location management</strong>
                <p>
                  Connecting real Google Business Profile locations will be
                  handled during the backend integration stage.
                </p>
              </div>
            </>
          )}
                    {activePage === "Create Post" && (
            <section className="create-post-page">
              <div className="page-heading">
                <div>
                  <h1>Create a New Post</h1>
                  <p>
                    Create and manage updates for your Google Business Profile
                    locations.
                  </p>
                </div>
                <button
                  className="secondary-btn"
                  onClick={startNewPost}
                  type="button"
                >
                  + New Post
                </button>
              </div>

              <div className="create-post-layout">
                <div className="create-post-form-card">
                  <div className="card-heading">
                    <div>
                      <h2>Post Details</h2>
                      <p>Choose a location and customize your post.</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="post-location">Business Location</label>
                    <select
                      value={selectedLocation?.id || ""}
                      onChange={(e) => {
                        const location = locations.find(
                          (item) => item.id === e.target.value
                        );
                        setSelectedLocation(location || null);
                      }}
                    >
                      <option value="">Select a location</option>

                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="post-topic">Post Topic</label>
                    <input
                      id="post-topic"
                      type="text"
                      placeholder="e.g. Special weekend offer"
                      value={postTopic}
                      onChange={(e) => setPostTopic(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="post-type">Post Type</label>
                      <select
                        id="post-type"
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                      >
                        <option>What's New</option>
                        <option>Event</option>
                        <option>Offer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="post-tone">Writing Tone</label>
                      <select
                        id="post-tone"
                        value={postTone}
                        onChange={(e) => setPostTone(e.target.value)}
                      >
                        <option>Professional</option>
                        <option>Friendly</option>
                        <option>Exciting</option>
                        <option>Informative</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="post-language">Language</label>
                      <select
                        id="post-language"
                        value={postLanguage}
                        onChange={(e) => setPostLanguage(e.target.value)}
                      >
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Marathi</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="post-cta">Call to Action</label>
                      <select
                        id="post-cta"
                        value={postCTA}
                        onChange={(e) => setPostCTA(e.target.value)}
                      >
                        <option>Learn More</option>
                        <option>Call Now</option>
                        <option>Book</option>
                        <option>Order Online</option>
                        <option>Sign Up</option>
                        <option>Get Offer</option>
                        <option>No Button</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="post-content">Post Content</label>
                    <textarea
                      id="post-content"
                      rows="7"
                      placeholder="Write your post content here, or generate a demo suggestion..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    />
                    <div className="character-count">
                      {postContent.length} characters
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={generateDemoContent}
                    >
                      ✨ Generate Content
                    </button>

                    <div className="form-actions-right">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={handleSaveDraft}
                      >
                        Save Draft
                      </button>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={handlePublish}
                      >
                        Publish Post
                      </button>
                    </div>
                  </div>

                  {postStatus && (
                    <div className="form-status-message">{postStatus}</div>
                  )}
                </div>

                <aside className="post-preview-card">
                  <div className="card-heading">
                    <div>
                      <h2>Post Preview</h2>
                      <p>Preview how your post details will appear.</p>
                    </div>
                    <span className="preview-badge">Preview</span>
                  </div>

                  <div className="preview-business">
                    <div className="preview-business-icon">G</div>
                    <div>
                      <strong>
                        {selectedLocation
                          ? selectedLocation.name
                          : "Your Business Name"}
                      </strong>
                      <p>
                        {selectedLocation
                          ? `${selectedLocation.address}, ${selectedLocation.city}`
                          : "Select a business location"}
                      </p>
                    </div>
                  </div>

                  <div className="preview-post-content">
                    <span className="preview-post-type">{postType}</span>
                    <h3>{postTopic || "Your post topic will appear here"}</h3>
                    <p>
                      {postContent ||
                        "Your post content will appear here when you start writing or generate a content suggestion."}
                    </p>
                  </div>

                  {postCTA !== "No Button" && (
                    <button className="preview-cta" type="button">
                      {postCTA}
                    </button>
                  )}

                  <div className="preview-footer">
                    <span>Google Business Profile</span>
                    <span>Preview only</span>
                  </div>
                </aside>
              </div>
            </section>
          )}
                    {activePage === "All Posts" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>All Posts</h1>
                  <p>
                    View, edit, and manage posts across your business
                    locations.
                  </p>
                </div>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={startNewPost}
                >
                  + Create Post
                </button>
              </div>

              <div className="posts-toolbar">
                <div className="post-filter-buttons">
                  {["All", "Draft", "Published"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={
                        postFilter === filter
                          ? "filter-btn active"
                          : "filter-btn"
                      }
                      onClick={() => setPostFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="post-search">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="posts-summary">
                <div className="summary-item">
                  <span>Total Posts</span>
                  <strong>{posts.length}</strong>
                </div>

                <div className="summary-item">
                  <span>Published</span>
                  <strong>
                    {posts.filter((post) => post.status === "Published").length}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Drafts</span>
                  <strong>
                    {posts.filter((post) => post.status === "Draft").length}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Showing</span>
                  <strong>{filteredPosts.length}</strong>
                </div>
              </div>

              <div className="managed-posts-list">
                {filteredPosts.length === 0 ? (
                  <div className="empty-posts-card">
                    <div className="empty-posts-icon">▤</div>
                    <h2>No posts found</h2>
                    <p>
                      {posts.length === 0
                        ? "You haven't created any posts yet."
                        : "No posts match your current search or filter."}
                    </p>

                    <button
                      className="primary-btn"
                      type="button"
                      onClick={startNewPost}
                    >
                      Create Your First Post
                    </button>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <article
                      className="managed-post-card"
                      key={post.id}
                    >
                      <div className="managed-post-main">
                        <div className="managed-post-top">
                          <div>
                            <span className="managed-post-type">
                              {post.type}
                            </span>

                            <h2>
                              {post.topic || "Untitled Post"}
                            </h2>
                          </div>

                          <span
                            className={
                              post.status === "Published"
                                ? "post-status published"
                                : "post-status draft"
                            }
                          >
                            {post.status}
                          </span>
                        </div>

                        <p className="managed-post-business">
                          {post.businessName}
                        </p>

                        <p className="managed-post-content">
                          {post.content || "No content added."}
                        </p>

                        <div className="managed-post-meta">
                          <span>✦ {post.tone}</span>
                          <span>◉ {post.language}</span>
                          <span>→ {post.cta}</span>
                          <span>
                            Updated: {post.updatedAt}
                          </span>
                        </div>
                      </div>

                      <div className="managed-post-actions">
                        <button
                          className="post-action-btn"
                          type="button"
                          onClick={() => handleEditPost(post)}
                        >
                          Edit
                        </button>

                        <button
                          className="post-action-btn"
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              post.id,
                              post.status === "Published"
                                ? "Draft"
                                : "Published"
                            )
                          }
                        >
                          {post.status === "Published"
                            ? "Move to Draft"
                            : "Publish"}
                        </button>

                        <button
                          className="post-action-btn danger"
                          type="button"
                          onClick={() =>
                            handleDeletePost(post.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, note, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <p className="stat-card-title">{title}</p>
          <h2 className="stat-card-value">{value}</h2>
        </div>

        <div className="stat-card-icon">{icon}</div>
      </div>

      <p className="stat-card-note">{note}</p>
    </div>
  );
}

function PostRow({ title, business, status }) {
  return (
    <div className="post-row">
      <div className="post-row-info">
        <strong>{title}</strong>
        <p>{business}</p>
      </div>

      <span
        className={
          status === "Published"
            ? "post-row-status published"
            : "post-row-status draft"
        }
      >
        {status}
      </span>
    </div>
  );
}

        