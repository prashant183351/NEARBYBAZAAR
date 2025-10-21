import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGODB_URI || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
    nodeEnv: process.env.NODE_ENV || 'development',
};
