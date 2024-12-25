import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async create(createDeviceDto: Partial<Device>): Promise<Device> {
    const device = new this.deviceModel(createDeviceDto);
    return device.save();
  }

  async findAll(userId: string): Promise<Device[]> {
    return this.deviceModel.find({ user_id: userId }).exec();
  }

  async findOne(id: string): Promise<Device> {
    return this.deviceModel.findById(id).exec();
  }

  async update(id: string, updateDeviceDto: Partial<Device>): Promise<Device> {
    return this.deviceModel
      .findByIdAndUpdate(id, updateDeviceDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Device> {
    return this.deviceModel.findByIdAndDelete(id).exec();
  }

  async updateDeviceStatus(id: string, status: string): Promise<Device> {
    return this.deviceModel
      .findByIdAndUpdate(
        id,
        {
          device_status: status,
          last_sync: new Date(),
        },
        { new: true },
      )
      .exec();
  }
}
