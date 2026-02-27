export class OssStorageService {
  async upload(_file: Express.Multer.File, key: string): Promise<string> {
    return `https://oss-example.local/${key}`;
  }

  async remove(_key: string): Promise<void> {
    return;
  }
}
