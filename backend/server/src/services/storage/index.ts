import { config } from '../../config';
import { LocalStorageService } from './local.storage';
import { OssStorageService } from './oss.storage';
import { QiniuStorageService } from './qiniu.storage';

const localStorage = new LocalStorageService();
const ossStorage = new OssStorageService();
const qiniuStorage = new QiniuStorageService();

export const storageService = {
  upload(file: Express.Multer.File, key: string) {
    if (config.upload.driver === 'oss') return ossStorage.upload(file, key);
    if (config.upload.driver === 'qiniu') return qiniuStorage.upload(file, key);
    return localStorage.upload(file, key);
  },
  remove(key: string) {
    if (config.upload.driver === 'oss') return ossStorage.remove(key);
    if (config.upload.driver === 'qiniu') return qiniuStorage.remove(key);
    return localStorage.remove(key);
  }
};
