const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6c757d',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post count
categorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Generate slug from name
categorySchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  try {
    this.slug = this.name
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

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ order: 1, name: 1 });
};

// Static method to find categories with post count
categorySchema.statics.findWithPostCount = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'category',
        as: 'posts'
      }
    },
    {
      $addFields: {
        postCount: { $size: '$posts' }
      }
    },
    {
      $project: {
        posts: 0
      }
    },
    {
      $match: {
        isActive: true
      }
    },
    {
      $sort: {
        order: 1,
        name: 1
      }
    }
  ]);
};

// Indexes for better query performance
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

module.exports = mongoose.model('Category', categorySchema); 