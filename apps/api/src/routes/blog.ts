import { Router, Request, Response } from 'express';
import { BlogPost } from '../models/BlogPost';

const router = Router();

// Create a new blog post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, author, tags, metaDescription } = req.body;
    const blogPost = new BlogPost({ title, content, author, tags, metaDescription });
    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create blog post', details: errorMessage });
  }
});

// Get all blog posts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const blogPosts = await BlogPost.find();
    res.status(200).json(blogPosts);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch blog posts', details: errorMessage });
  }
});

// Get a single blog post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPost);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch blog post', details: errorMessage });
  }
});

// Update a blog post by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, content, author, tags, metaDescription } = req.body;
    const blogPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content, author, tags, metaDescription, updatedAt: new Date() },
      { new: true }
    );
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPost);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update blog post', details: errorMessage });
  }
});

// Delete a blog post by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const blogPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to delete blog post', details: errorMessage });
  }
});

export default router;