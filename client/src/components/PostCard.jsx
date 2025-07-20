import React from 'react';
import Button from './Button';

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onEdit, 
  onDelete, 
  showActions = true,
  isAuthor = false 
}) => {
  const {
    _id,
    title,
    content,
    author,
    category,
    status,
    views,
    likes = [],
    comments = [],
    createdAt,
    readingTime,
    tags = []
  } = post;

  const handleLike = () => {
    if (onLike) {
      onLike(_id);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(_id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(_id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this post?')) {
      onDelete(_id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-meta">
          <span className="post-author">
            {author?.profile?.firstName && author?.profile?.lastName
              ? `${author.profile.firstName} ${author.profile.lastName}`
              : author?.username || 'Unknown Author'
            }
          </span>
          <span className="post-date">{formatDate(createdAt)}</span>
          {category && (
            <span className="post-category">{category.name}</span>
          )}
          {status !== 'published' && (
            <span className="post-status">{status}</span>
          )}
        </div>
        
        <h2 className="post-title">{title}</h2>
        
        {tags.length > 0 && (
          <div className="post-tags">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="post-content">
        <p>{truncateContent(content)}</p>
      </div>

      <footer className="post-footer">
        <div className="post-stats">
          <span className="stat">
            <i className="icon-eye"></i>
            {views} views
          </span>
          <span className="stat">
            <i className="icon-heart"></i>
            {likes.length} likes
          </span>
          <span className="stat">
            <i className="icon-comment"></i>
            {comments.length} comments
          </span>
          {readingTime && (
            <span className="stat">
              <i className="icon-clock"></i>
              {readingTime} min read
            </span>
          )}
        </div>

        {showActions && (
          <div className="post-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLike}
            >
              <i className="icon-heart"></i>
              Like
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleComment}
            >
              <i className="icon-comment"></i>
              Comment
            </Button>

            {isAuthor && (
              <>
                <Button
                  variant="info"
                  size="sm"
                  onClick={handleEdit}
                >
                  <i className="icon-edit"></i>
                  Edit
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                >
                  <i className="icon-delete"></i>
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </footer>
    </article>
  );
};

export default PostCard; 