import React, { useState, useEffect } from 'react';
import Button from './components/Button';
import Form from './components/Form';
import PostCard from './components/PostCard';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Debug Panel Component
const DebugPanel = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isVisible) {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        setLogs(prev => [...prev, { type: 'log', message: args.join(' '), timestamp: new Date() }]);
        originalConsoleLog(...args);
      };

      console.error = (...args) => {
        setLogs(prev => [...prev, { type: 'error', message: args.join(' '), timestamp: new Date() }]);
        originalConsoleError(...args);
      };

      console.warn = (...args) => {
        setLogs(prev => [...prev, { type: 'warn', message: args.join(' '), timestamp: new Date() }]);
        originalConsoleWarn(...args);
      };

      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Debug Panel</h3>
        <Button onClick={onToggle} variant="secondary" size="sm">
          Close
        </Button>
      </div>
      <div className="debug-content">
        <h4>Console Logs</h4>
        <div className="log-container">
          {logs.map((log, index) => (
            <div key={index} className={`log-entry log-${log.type}`}>
              <span className="log-timestamp">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [debugVisible, setDebugVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample data for testing
  const samplePosts = [
    {
      _id: '1',
      title: 'Getting Started with React Testing',
      content: 'React Testing Library is a great tool for testing React components. It encourages you to test your components in a way that resembles how users interact with your app.',
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
        { user: { username: 'commenter1' }, content: 'Great article!' },
        { user: { username: 'commenter2' }, content: 'Very helpful!' }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      readingTime: 3,
      tags: ['react', 'testing', 'javascript']
    },
    {
      _id: '2',
      title: 'Advanced Jest Configuration',
      content: 'Jest is a delightful JavaScript Testing Framework with a focus on simplicity. It works with projects using Babel, TypeScript, Node.js, React, Angular, Vue.js and more.',
      author: {
        username: 'testuser2',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith'
        }
      },
      category: { name: 'Testing', slug: 'testing' },
      status: 'published',
      views: 89,
      likes: ['user3'],
      comments: [],
      createdAt: '2024-01-14T15:30:00Z',
      readingTime: 5,
      tags: ['jest', 'testing', 'configuration']
    }
  ];

  useEffect(() => {
    // Simulate loading posts
    setLoading(true);
    setTimeout(() => {
      setPosts(samplePosts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLike = (postId) => {
    console.log('Liking post:', postId);
    setPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, likes: [...post.likes, 'currentUser'] }
          : post
      )
    );
  };

  const handleComment = (postId) => {
    console.log('Commenting on post:', postId);
    // In a real app, this would open a comment form
  };

  const handleEdit = (postId) => {
    console.log('Editing post:', postId);
    // In a real app, this would navigate to edit form
  };

  const handleDelete = (postId) => {
    console.log('Deleting post:', postId);
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleFormSubmit = async (formData) => {
    console.log('Form submitted:', formData);
    // In a real app, this would send data to server
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const renderHome = () => (
    <div className="home-view">
      <h1>MERN Testing Assignment</h1>
      <p>Welcome to the testing and debugging demonstration app.</p>
      
      <div className="demo-section">
        <h2>Button Component Demo</h2>
        <div className="button-demo">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="success">Success Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </div>

      <div className="demo-section">
        <h2>Form Component Demo</h2>
        <Form
          onSubmit={handleFormSubmit}
          fields={[
            {
              name: 'username',
              label: 'Username',
              type: 'text',
              placeholder: 'Enter username',
              validation: {
                required: true,
                minLength: 3,
                maxLength: 30
              }
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'Enter email',
              validation: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                patternMessage: 'Please enter a valid email address'
              }
            },
            {
              name: 'message',
              label: 'Message',
              type: 'textarea',
              placeholder: 'Enter your message',
              validation: {
                required: true,
                minLength: 10
              }
            }
          ]}
          submitText="Submit Form"
        />
      </div>

      <div className="demo-section">
        <h2>Post Cards Demo</h2>
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isAuthor={post.author.username === 'testuser'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="about-view">
      <h1>About This Project</h1>
      <p>This is a comprehensive testing and debugging demonstration for a MERN stack application.</p>
      
      <h2>Features Demonstrated</h2>
      <ul>
        <li>Unit testing with Jest and React Testing Library</li>
        <li>Integration testing with Supertest</li>
        <li>Error boundaries for React error handling</li>
        <li>Debugging tools and logging</li>
        <li>Form validation and error handling</li>
        <li>Component testing with mocks</li>
      </ul>

      <h2>Testing Coverage</h2>
      <p>The project includes tests for:</p>
      <ul>
        <li>React components (Button, Form, PostCard)</li>
        <li>API endpoints (authentication, posts, users)</li>
        <li>Utility functions (validation, authentication)</li>
        <li>Error handling and edge cases</li>
      </ul>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <nav className="app-nav">
            <Button 
              variant={currentView === 'home' ? 'primary' : 'secondary'}
              onClick={() => setCurrentView('home')}
            >
              Home
            </Button>
            <Button 
              variant={currentView === 'about' ? 'primary' : 'secondary'}
              onClick={() => setCurrentView('about')}
            >
              About
            </Button>
            <Button 
              variant="info"
              size="sm"
              onClick={() => setDebugVisible(!debugVisible)}
            >
              Debug
            </Button>
          </nav>
        </header>

        <main className="app-main">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {currentView === 'home' && renderHome()}
          {currentView === 'about' && renderAbout()}
        </main>

        <DebugPanel 
          isVisible={debugVisible} 
          onToggle={() => setDebugVisible(false)} 
        />
      </div>
    </ErrorBoundary>
  );
};

export default App; 