import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
      index: 'text'
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    dueDate: {
      type: Date,
      index: true
    },
    estimateHours: {
      type: Number,
      min: 0,
      default: 0
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    project: {
      type: String,
      trim: true,
      index: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    completedAt: {
      type: Date
    },
    position: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

taskSchema.index({ title: 'text', description: 'text', tags: 'text' });
taskSchema.index({ status: 1, priority: 1, dueDate: 1 });

taskSchema.pre('save', function setCompletionTimestamp(next) {
  if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== 'done') {
    this.completedAt = undefined;
  }

  next();
});

export const Task = mongoose.model('Task', taskSchema);