import mongoose, { Schema, Document } from 'mongoose';

export interface IOAuthClient extends Document {
    client_id: string;
    client_secret: string;
    name: string;
    scopes?: string[]; // Added scopes field to interface
}

const OAuthClientSchema: Schema = new Schema({
    client_id: { type: String, required: true, unique: true },
    client_secret: { type: String, required: true },
    name: { type: String, required: true },
    scopes: { type: [String], default: [] }, // Added scopes field to schema
});

export const OAuthClient = mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);