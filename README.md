# GBP Post Manager

A web application for creating, managing, and publishing Google Business Profile (GBP) posts.

The application provides a dashboard where users can manage locations, create GBP posts, generate post content using AI, select calls-to-action, preview posts, save drafts, and manage published posts.

## Project Overview

GBP Post Manager is designed to simplify the process of creating and managing Google Business Profile posts.

Users can:

- Sign up and log in
- Access a dashboard
- Manage GBP locations
- Create new GBP posts
- Generate post content using AI
- Select a call-to-action (CTA)
- Preview posts before publishing
- Save posts as drafts
- Publish posts
- Manage existing posts

## Features

### Authentication
- User sign up
- User login
- Authentication handled using Supabase

### Dashboard
- Central dashboard for managing GBP posts
- Access to locations and post management features

### Location Management
- View and manage GBP locations
- Select a location when creating a post

### GBP Post Creation
- Create new Google Business Profile posts
- Enter and edit post content
- Select a call-to-action
- Preview the post before publishing

### AI Content Generation
- Generate post content using AI
- Use generated content as a starting point
- Edit generated content before publishing

### Draft Management
- Save posts as drafts
- Continue editing saved drafts

### Publishing
- Review the post before publishing
- Publish a completed post

### Post Management
- View and manage created posts
- Manage drafts and published posts

## Technology Stack

### Frontend
- Next.js
- React
- JavaScript
- CSS

### Backend / Services
- Supabase
- Supabase Authentication
- Supabase Database

### Development Tools
- Node.js
- npm
- ESLint

## Project Structure

```text
gbp-post-manager/
│
├── public/
│
├── src/
│   └── app/
│       ├── lib/
│       │   └── supabase/
│       ├── login/
│       ├── signup/
│       └── ...
│
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── README.md
