import { useSiteSettings } from '../hooks';
import { resolveSafeUrl } from '../utils';

const COMMUNITY_RAW_URL = String(import.meta.env.VITE_COMMUNITY_URL ?? 'https://pixora.vip').trim();
const COMMUNITY_URL = resolveSafeUrl(COMMUNITY_RAW_URL, {
  allowRelative: false,
  allowMailTo: false,
  allowTel: false,
  allowHash: false
});
const COMMUNITY_BLOG_URL = COMMUNITY_URL ? `${COMMUNITY_URL.replace(/\/+$/, '')}/blog` : '';

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
    <footer className="cp-footer">
      <div className="cp-footer-inner">
        {hasContact && (
          <div className="cp-footer-contact">
            <span className="cp-footer-contact-title">联系我们</span>
            <div className="cp-footer-contact-info">
              {contactEmail && <span>邮箱：{contactEmail}</span>}
              {contactPhone && <span>电话：{contactPhone}</span>}
              {contactWechat && <span>微信：{contactWechat}</span>}
              {contactQQ && <span>QQ：{contactQQ}</span>}
              {contactAddress && <span>地址：{contactAddress}</span>}
            </div>
          </div>
        )}
        {hasQRCode && (
          <div className="cp-footer-qrcode">
            {contactWechatQR && (
              <div className="cp-footer-qrcode-item">
                <img src={contactWechatQR} alt="微信二维码" />
                <span>微信扫码联系</span>
              </div>
            )}
            {contactQQQR && (
              <div className="cp-footer-qrcode-item">
                <img src={contactQQQR} alt="QQ二维码" />
                <span>QQ扫码联系</span>
              </div>
            )}
          </div>
        )}
        <div className="cp-footer-bottom">
          <span className="cp-footer-copy">{siteName} &copy; {new Date().getFullYear()}{icp ? ` · ${icp}` : ''}</span>
          <nav className="cp-footer-links">
            {COMMUNITY_URL ? (
              <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
                社区论坛
              </a>
            ) : (
              <span title="请配置有效 VITE_COMMUNITY_URL" style={{ opacity: 0.6 }}>
                社区论坛
              </span>
            )}
            {COMMUNITY_BLOG_URL ? (
              <a href={COMMUNITY_BLOG_URL} target="_blank" rel="noopener noreferrer">
                博客
              </a>
            ) : (
              <span title="请配置有效 VITE_COMMUNITY_URL" style={{ opacity: 0.6 }}>
                博客
              </span>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
};
