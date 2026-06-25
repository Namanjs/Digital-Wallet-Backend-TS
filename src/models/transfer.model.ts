import mongoose, { Schema, Document, Types } from 'mongoose';

export enum transferStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
};

export interface ITransfer extends Document {
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;
    amount: number;
    status: transferStatus;
    idempotencyKey: number
};

const transferSchema: Schema<ITransfer> = new mongoose.Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: Object.values(transferStatus),
        default: transferStatus.PENDING
    },
    idempotencyKey: {
        type: Number,
        required: true,
        unique: true
    }
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt"
    }
});

transferSchema.index({ senderId: 1, createdAt: -1 });
transferSchema.index({ receiverId: 1, createdAt: -1 });

export const Transfer = mongoose.model<ITransfer>("Transfer", transferSchema)