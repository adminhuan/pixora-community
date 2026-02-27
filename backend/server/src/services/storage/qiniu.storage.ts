export class QiniuStorageService {
  async upload(_file: Express.Multer.File, key: string): Promise<string> {
    return `https://qiniu-example.local/${key}`;
  }

  async remove(_key: string): Promise<void> {
    return;
  }
}
