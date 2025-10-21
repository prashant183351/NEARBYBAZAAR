import mongoose, { Schema, Document } from 'mongoose';

export interface IOAuthToken extends Document {
    token: string;
    client_id: string;
    expires_at: Date;
    scopes: string[]; // Added scopes field
}

const OAuthTokenSchema: Schema = new Schema({
    token: { type: String, required: true, unique: true },
    client_id: { type: String, required: true },
    expires_at: { type: Date, required: true },
    scopes: { type: [String], default: [] }, // Added scopes field
});

export const OAuthToken = mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);