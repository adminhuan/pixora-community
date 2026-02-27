import { useSiteSettings } from '../hooks/useSiteSettings';

export const Footer = () => {
  const {
    siteName,
    contactEmail,
    contactPhone,
    contactWechat,
    contactWechatQR,
    contactQQ,
    contactQQQR,
    contactAddress,
    icp,
  } = useSiteSettings();

  const hasContact = contactEmail || contactPhone || contactWechat || contactQQ || contactAddress;
  const hasQRCode = contactWechatQR || contactQQQR;

  return (
    <footer className="apc-footer">
      <div className="apc-footer-inner">
        {hasContact && (
          <div className="apc-footer-contact">
            <span className="apc-footer-contact-title">联系我们</span>
            <div className="apc-footer-contact-info">
              {contactEmail && <span>邮箱：{contactEmail}</span>}
              {contactPhone && <span>电话：{contactPhone}</span>}
              {contactWechat && <span>微信：{contactWechat}</span>}
              {contactQQ && <span>QQ：{contactQQ}</span>}
              {contactAddress && <span>地址：{contactAddress}</span>}
            </div>
          </div>
        )}
        {hasQRCode && (
          <div className="apc-footer-qrcode">
            {contactWechatQR && (
              <div className="apc-footer-qrcode-item">
                <img src={contactWechatQR} alt="微信二维码" />
                <span>微信扫码联系</span>
              </div>
            )}
            {contactQQQR && (
              <div className="apc-footer-qrcode-item">
                <img src={contactQQQR} alt="QQ二维码" />
                <span>QQ扫码联系</span>
              </div>
            )}
          </div>
        )}
        <div className="apc-footer-copyright">
          {siteName} &copy; {new Date().getFullYear()}
          {icp ? ` · ${icp}` : ''}
        </div>
      </div>
    </footer>
  );
};
