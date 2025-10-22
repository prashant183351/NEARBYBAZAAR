import { Schema, model, Document, Types } from 'mongoose';
import { generateSlug } from '@nearbybazaar/lib';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parent?: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    ancestors: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ ancestors: 1 });

CategorySchema.pre('validate', async function (next) {
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Maintain ancestors path on save if parent changed
CategorySchema.pre('save', async function (next) {
  if (!this.isModified('parent')) return next();
  if (!this.parent) {
    this.ancestors = [];
    return next();
  }
  const parentCat = await Category.findById(this.parent).select('ancestors');
  if (parentCat) {
    // @ts-ignore
    this.ancestors = [...(parentCat.ancestors as Types.ObjectId[]), parentCat._id];
  } else {
    this.ancestors = [];
  }
  next();
});

export const Category = model<ICategory>('Category', CategorySchema);

// Helper to retrieve all descendant ids (including the category itself if includeSelf)
export async function getDescendantCategoryIds(
  categoryId: Types.ObjectId | string,
  includeSelf = true,
): Promise<string[]> {
  const id = typeof categoryId === 'string' ? new Types.ObjectId(categoryId) : categoryId;
  const descendants = await Category.find({ ancestors: id }).select('_id').lean();
  const ids = descendants.map((d) => String(d._id));
  if (includeSelf) ids.push(String(id));
  return ids;
}
