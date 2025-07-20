import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCard from '../../components/PostCard';

describe('PostCard Component', () => {
  const mockPost = {
    _id: '1',
    title: 'Test Post Title',
    content: 'This is a test post content that should be displayed in the post card component.',
    author: {
      username: 'testuser',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    },
    category: { name: 'Testing', slug: 'testing' },
    status: 'published',
    views: 150,
    likes: ['user1', 'user2'],
    comments: [
      { user: { username: 'commenter1' }, content: 'Great post!' },
      { user: { username: 'commenter2' }, content: 'Very helpful!' }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    readingTime: 3,
    tags: ['react', 'testing', 'javascript']
  };

  const mockHandlers = {
    onLike: jest.fn(),
    onComment: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders post title and content', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a test post content/)).toBeInTheDocument();
  });

  it('displays author information', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays category information', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('displays post statistics', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('150 views')).toBeInTheDocument();
    expect(screen.getByText('2 likes')).toBeInTheDocument();
    expect(screen.getByText('2 comments')).toBeInTheDocument();
    expect(screen.getByText('3 min read')).toBeInTheDocument();
  });

  it('displays tags', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<PostCard post={mockPost} />);
    
    // The exact date format depends on locale, so we check for the year
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', () => {
    render(<PostCard post={mockPost} onLike={mockHandlers.onLike} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);
    
    expect(mockHandlers.onLike).toHaveBeenCalledWith('1');
  });

  it('calls onComment when comment button is clicked', () => {
    render(<PostCard post={mockPost} onComment={mockHandlers.onComment} />);
    
    const commentButton = screen.getByRole('button', { name: /comment/i });
    fireEvent.click(commentButton);
    
    expect(mockHandlers.onComment).toHaveBeenCalledWith('1');
  });

  it('shows edit and delete buttons when user is author', () => {
    render(
      <PostCard 
        post={mockPost} 
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        isAuthor={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not show edit and delete buttons when user is not author', () => {
    render(
      <PostCard 
        post={mockPost} 
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        isAuthor={false}
      />
    );
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <PostCard 
        post={mockPost} 
        onEdit={mockHandlers.onEdit}
        isAuthor={true}
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button is clicked', () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    
    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockHandlers.onDelete}
        isAuthor={true}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('does not call onDelete when user cancels confirmation', () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);
    
    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockHandlers.onDelete}
        isAuthor={true}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('handles post without author profile information', () => {
    const postWithoutProfile = {
      ...mockPost,
      author: {
        username: 'testuser'
      }
    };
    
    render(<PostCard post={postWithoutProfile} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('handles post without category', () => {
    const postWithoutCategory = {
      ...mockPost,
      category: null
    };
    
    render(<PostCard post={postWithoutCategory} />);
    
    expect(screen.queryByText('Testing')).not.toBeInTheDocument();
  });

  it('handles post without tags', () => {
    const postWithoutTags = {
      ...mockPost,
      tags: []
    };
    
    render(<PostCard post={postWithoutTags} />);
    
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  it('handles post without reading time', () => {
    const postWithoutReadingTime = {
      ...mockPost,
      readingTime: null
    };
    
    render(<PostCard post={postWithoutReadingTime} />);
    
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it('shows status when not published', () => {
    const draftPost = {
      ...mockPost,
      status: 'draft'
    };
    
    render(<PostCard post={draftPost} />);
    
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('does not show status when published', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.queryByText('published')).not.toBeInTheDocument();
  });

  it('hides actions when showActions is false', () => {
    render(<PostCard post={mockPost} showActions={false} />);
    
    expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /comment/i })).not.toBeInTheDocument();
  });

  it('truncates long content', () => {
    const longContent = 'a'.repeat(200);
    const postWithLongContent = {
      ...mockPost,
      content: longContent
    };
    
    render(<PostCard post={postWithLongContent} />);
    
    const contentElement = screen.getByText(/a{150}\.\.\./);
    expect(contentElement).toBeInTheDocument();
  });

  it('handles zero views, likes, and comments', () => {
    const emptyPost = {
      ...mockPost,
      views: 0,
      likes: [],
      comments: []
    };
    
    render(<PostCard post={emptyPost} />);
    
    expect(screen.getByText('0 views')).toBeInTheDocument();
    expect(screen.getByText('0 likes')).toBeInTheDocument();
    expect(screen.getByText('0 comments')).toBeInTheDocument();
  });
}); 