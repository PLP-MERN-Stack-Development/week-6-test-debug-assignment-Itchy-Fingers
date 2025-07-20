const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters long'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  meta: {
    description: {
      type: String,
      maxlength: [300, 'Meta description cannot exceed 300 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      maxlength: [50, 'Keyword cannot exceed 50 characters']
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for reading time (estimated)
postSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(' ').length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Generate slug from title
postSchema.pre('save', function(next) {
  if (!this.isModified('title')) return next();
  
  try {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    next();
  } catch (error) {
    next(error);
  }
});

// Method to increment views
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

// Method to toggle like
postSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  
  return await this.save();
};

// Method to add comment
postSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  
  return await this.save();
};

// Static method to find published posts
postSchema.statics.findPublished = function() {
  return this.find({ status: 'published' })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name')
    .sort({ createdAt: -1 });
};

// Static method to find posts by category
postSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId, 
    status: 'published' 
  })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name')
    .sort({ createdAt: -1 });
};

// Static method to search posts
postSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { status: 'published' },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name')
    .sort({ createdAt: -1 });
};

// Indexes for better query performance
postSchema.index({ slug: 1 });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema); 