/**
 * ProductOffer Controller
 * Feature #182 - Multi-seller marketplace
 *
 * Handles CRUD operations for product offers with business rule enforcement:
 * - Vendors can create/update/delete their own offers
 * - One offer per vendor per product (enforced by unique index)
 * - No negative prices or stock
 * - Stock cannot exceed vendor's inventory
 * - Auto-pause offers when stock reaches zero
 */

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ProductOffer, IProductOffer } from '../models/ProductOffer';
// import { Product } from '../models/Product'; // Uncomment when Product model exists
// import { Vendor } from '../models/Vendor'; // Uncomment when Vendor model exists

// ==================== TYPES ====================

// Use the same Request.user type as defined in middleware/auth.ts
// (UserClaims & { scopes?: string[] })

interface CreateOfferRequest {
  productId: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  shippingTerms: {
    sla: number;
    freeShippingThreshold?: number;
    shippingCharge: number;
    handlingTime: number;
  };
  fulfillmentMethod?: 'FBM' | 'FBA' | 'dropship';
  condition?: 'new' | 'refurbished' | 'used-like-new' | 'used-good' | 'used-acceptable';
  conditionNotes?: string;
}

interface UpdateOfferRequest {
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  shippingTerms?: {
    sla?: number;
    freeShippingThreshold?: number;
    shippingCharge?: number;
    handlingTime?: number;
  };
  fulfillmentMethod?: 'FBM' | 'FBA' | 'dropship';
  condition?: 'new' | 'refurbished' | 'used-like-new' | 'used-good' | 'used-acceptable';
  conditionNotes?: string;
  isActive?: boolean;
  isPaused?: boolean;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate that vendor owns the offer
 */
const validateOwnership = (offer: IProductOffer, vendorId: string): boolean => {
  return offer.vendorId.toString() === vendorId;
};

/**
 * Validate stock doesn't exceed vendor's inventory
 * TODO: Implement when Vendor/Inventory models are ready
 */
const validateInventory = async (
  _vendorId: string,
  _productId: string,
  _requestedStock: number,
): Promise<boolean> => {
  // Placeholder - in production, check against vendor's actual inventory
  // const vendor = await Vendor.findById(vendorId);
  // const inventory = await vendor.getInventory(productId);
  // return requestedStock <= inventory.available;
  return true;
};

/**
 * Check if product exists and is active
 * TODO: Implement when Product model is ready
 */
const validateProduct = async (_productId: string): Promise<boolean> => {
  // const product = await Product.findById(productId);
  // return product && product.isActive;
  return true;
};

// ==================== CONTROLLER FUNCTIONS ====================

/**
 * Create a new offer for a product
 * POST /api/offers
 * Auth: Vendor only
 */
export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;
    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    const data: CreateOfferRequest = req.body;

    // Validate product exists
    const productExists = await validateProduct(data.productId);
    if (!productExists) {
      res.status(404).json({
        success: false,
        error: 'Product not found or inactive',
      });
      return;
    }

    // Validate stock doesn't exceed inventory
    const hasInventory = await validateInventory(vendorId, data.productId, data.stock);
    if (!hasInventory) {
      res.status(400).json({
        success: false,
        error: 'Stock exceeds available inventory',
      });
      return;
    }

    // Check for existing offer (should be caught by unique index, but explicit check is clearer)
    const existingOffer = await ProductOffer.findVendorOffer(data.productId, vendorId);
    if (existingOffer) {
      res.status(409).json({
        success: false,
        error: 'You already have an offer for this product. Use update instead.',
        offerId: existingOffer._id,
      });
      return;
    }

    // Create offer
    const offer = await ProductOffer.create({
      productId: data.productId,
      vendorId,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      shippingTerms: data.shippingTerms,
      fulfillmentMethod: data.fulfillmentMethod ?? 'FBM',
      condition: data.condition ?? 'new',
      conditionNotes: data.conditionNotes,
      isActive: true,
      isPaused: data.stock === 0, // Auto-pause if no stock
    });

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Offer created successfully',
    });
  } catch (error: any) {
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'You already have an offer for this product',
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map((e: any) => e.message),
      });
      return;
    }

    console.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create offer',
    });
  }
};

/**
 * Update an existing offer
 * PUT /api/offers/:id
 * Auth: Vendor (owner only)
 */
export const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;
    const data: UpdateOfferRequest = req.body;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    // Find offer
    const offer = await ProductOffer.findById(id);
    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    // Validate ownership
    if (!validateOwnership(offer, vendorId)) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own offers',
      });
      return;
    }

    // If updating stock, validate inventory
    if (data.stock !== undefined) {
      const hasInventory = await validateInventory(
        vendorId,
        offer.productId.toString(),
        data.stock,
      );
      if (!hasInventory) {
        res.status(400).json({
          success: false,
          error: 'Stock exceeds available inventory',
        });
        return;
      }
    }

    // Update fields
    if (data.price !== undefined) offer.price = data.price;
    if (data.compareAtPrice !== undefined) offer.compareAtPrice = data.compareAtPrice;
    if (data.stock !== undefined) offer.stock = data.stock;
    if (data.lowStockThreshold !== undefined) offer.lowStockThreshold = data.lowStockThreshold;
    if (data.fulfillmentMethod !== undefined) offer.fulfillmentMethod = data.fulfillmentMethod;
    if (data.condition !== undefined) offer.condition = data.condition;
    if (data.conditionNotes !== undefined) offer.conditionNotes = data.conditionNotes;
    if (data.isActive !== undefined) offer.isActive = data.isActive;
    if (data.isPaused !== undefined) offer.isPaused = data.isPaused;

    // Update shipping terms (partial update supported)
    if (data.shippingTerms) {
      if (data.shippingTerms.sla !== undefined) {
        offer.shippingTerms.sla = data.shippingTerms.sla;
      }
      if (data.shippingTerms.freeShippingThreshold !== undefined) {
        offer.shippingTerms.freeShippingThreshold = data.shippingTerms.freeShippingThreshold;
      }
      if (data.shippingTerms.shippingCharge !== undefined) {
        offer.shippingTerms.shippingCharge = data.shippingTerms.shippingCharge;
      }
      if (data.shippingTerms.handlingTime !== undefined) {
        offer.shippingTerms.handlingTime = data.shippingTerms.handlingTime;
      }
    }

    await offer.save();

    res.json({
      success: true,
      data: offer,
      message: 'Offer updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map((e: any) => e.message),
      });
      return;
    }

    console.error('Update offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offer',
    });
  }
};

/**
 * Delete an offer (soft delete - marks as inactive)
 * DELETE /api/offers/:id
 * Auth: Vendor (owner only)
 */
export const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    const offer = await ProductOffer.findById(id);
    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    // Validate ownership
    if (!validateOwnership(offer, vendorId)) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own offers',
      });
      return;
    }

    // Soft delete
    offer.isActive = false;
    await offer.save();

    res.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete offer',
    });
  }
};

/**
 * Get all offers for a product (public - for "More Buying Options")
 * GET /api/offers/product/:productId
 * Auth: Public
 */
export const getProductOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
      return;
    }

    const offers = await ProductOffer.findActiveOffers(productId);

    res.json({
      success: true,
      data: offers,
      count: offers.length,
    });
  } catch (error) {
    console.error('Get product offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve offers',
    });
  }
};

/**
 * Get vendor's own offers
 * GET /api/offers/my-offers
 * Auth: Vendor only
 */
export const getMyOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    const offers = await ProductOffer.findByVendor(vendorId);

    res.json({
      success: true,
      data: offers,
      count: offers.length,
    });
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve offers',
    });
  }
};

/**
 * Get a single offer by ID
 * GET /api/offers/:id
 * Auth: Public (for active offers), Vendor (for own offers)
 */
export const getOfferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid offer ID',
      });
      return;
    }

    const offer = await ProductOffer.findById(id)
      .populate('productId', 'name slug images category')
      .populate('vendorId', 'name slug logo rating');

    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    // If offer is inactive, only owner can view
    if (!offer.isActive && (!vendorId || offer.vendorId.toString() !== vendorId)) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    res.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Get offer by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve offer',
    });
  }
};

/**
 * Update stock for an offer (atomic operation)
 * PATCH /api/offers/:id/stock
 * Auth: Vendor (owner only)
 */
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body; // Can be positive (add) or negative (subtract)
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    if (typeof quantity !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Quantity must be a number',
      });
      return;
    }

    const offer = await ProductOffer.findById(id);
    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    // Validate ownership
    if (!validateOwnership(offer, vendorId)) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own offers',
      });
      return;
    }

    // Use atomic update method
    await offer.updateStock(quantity);

    res.json({
      success: true,
      data: {
        offerId: offer._id,
        newStock: offer.stock,
        lastStockUpdate: offer.lastStockUpdate,
      },
      message: `Stock ${quantity >= 0 ? 'increased' : 'decreased'} by ${Math.abs(quantity)}`,
    });
  } catch (error: any) {
    if (error.message === 'Insufficient stock or offer not found') {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock for this operation',
      });
      return;
    }

    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock',
    });
  }
};

/**
 * Get low stock alerts for vendor
 * GET /api/offers/low-stock
 * Auth: Vendor only
 */
export const getLowStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    const offers = await ProductOffer.find({
      vendorId,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      stock: { $gt: 0 }, // Exclude out-of-stock
    })
      .populate('productId', 'name slug sku')
      .sort({ stock: 1 }); // Lowest stock first

    res.json({
      success: true,
      data: offers,
      count: offers.length,
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve low stock alerts',
    });
  }
};

/**
 * Toggle pause status
 * PATCH /api/offers/:id/pause
 * Auth: Vendor (owner only)
 */
export const togglePause = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as { id: string; role: string } | undefined;
    const vendorId = user && user.role === 'vendor' ? user.id : undefined;

    if (!vendorId) {
      res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
      });
      return;
    }

    const offer = await ProductOffer.findById(id);
    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
      return;
    }

    if (!validateOwnership(offer, vendorId)) {
      res.status(403).json({
        success: false,
        error: 'You can only pause your own offers',
      });
      return;
    }

    offer.isPaused = !offer.isPaused;
    await offer.save();

    res.json({
      success: true,
      data: {
        offerId: offer._id,
        isPaused: offer.isPaused,
      },
      message: offer.isPaused ? 'Offer paused' : 'Offer resumed',
    });
  } catch (error) {
    console.error('Toggle pause error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle pause status',
    });
  }
};
