// Email signatures for each revenue arm — HTML format for Resend

const LEGAL_NOTICE = `<p style="margin:16px 0 0;font-size:10px;color:#999;max-width:520px;line-height:1.5;">
Legal Notice: This message is intended for the addressee(s) only and, unless expressly stated otherwise, is confidential and may be privileged. If you are not an addressee, (i) please inform the sender immediately and permanently delete and destroy the original and any copies or printouts of this message, and (ii) be advised that any disclosure, copying or use of the information in this message is unauthorized and may be unlawful.
</p>`

export const BRIDGE_VIDEO_SIGNATURE = `
<table style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;margin-top:32px;border-collapse:collapse;">
  <tr><td style="padding-bottom:20px;color:#444;">Best regards,</td></tr>
  <tr><td style="padding-bottom:4px;">
    <strong style="font-size:15px;">Jerry D. White</strong>
  </td></tr>
  <tr><td style="padding-bottom:14px;color:#666;">Founder &amp; Content Creator</td></tr>
  <tr><td style="padding-bottom:14px;">
    <img src="https://bridgevideo.co/logos/Bridge%20Video_words_color_black%20outline%20%5BSIGNATURE%5D.png"
         alt="Bridge Video" width="160" style="display:block;">
  </td></tr>
  <tr><td style="padding-bottom:4px;">Direct: 813-790-8810</td></tr>
  <tr><td style="padding-bottom:4px;">
    <a href="https://bridgevideo.co" style="color:#1a1a1a;text-decoration:none;">Bridge Video LLC</a> &nbsp;|&nbsp; bridgevideo.co
  </td></tr>
  <tr><td>${LEGAL_NOTICE}</td></tr>
</table>`

export const CONSULTING_SIGNATURE = `
<table style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;margin-top:32px;border-collapse:collapse;">
  <tr><td style="padding-bottom:20px;color:#444;">Best regards,</td></tr>
  <tr><td style="padding-bottom:4px;">
    <strong style="font-size:15px;">Jerry D. White</strong>
  </td></tr>
  <tr><td style="padding-bottom:14px;color:#666;">Founder &amp; Creative Director</td></tr>
  <tr><td style="padding-bottom:14px;">
    <img src="https://app-iota-inky-62.vercel.app/logos/jdp-email-signature.png"
         alt="JD Productions" width="160" style="display:block;">
  </td></tr>
  <tr><td style="padding-bottom:4px;">Direct: 813-790-8810</td></tr>
  <tr><td style="padding-bottom:10px;">
    <strong>JD Productions Inc.</strong>
  </td></tr>
  <tr><td style="padding-bottom:4px;">
    <a href="https://www.linkedin.com/in/jdwhite099" style="color:#1a1a1a;text-decoration:none;">LinkedIn</a>
  </td></tr>
  <tr><td>${LEGAL_NOTICE}</td></tr>
</table>`

// WP signature mirrors the official Wholesale Payments format (logo left, info right, dual divider lines)
export const WHOLESALE_PAYMENTS_SIGNATURE = `
<table style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;margin-top:32px;border-collapse:collapse;width:520px;">
  <tr>
    <td style="vertical-align:top;padding-right:24px;width:140px;">
      <img src="https://wholesalepayments.com/assets/img/footerlogo.svg"
           alt="Wholesale Payments" width="130" style="display:block;">
    </td>
    <td style="vertical-align:top;">
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="padding-bottom:2px;">
            <strong style="font-size:15px;">Jerry White</strong>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <a href="https://linkedin.com/company/wholesale-payments" style="text-decoration:none;margin-right:4px;">
              <img src="https://cdn-icons-png.flaticon.com/16/174/174857.png" width="16" height="16" alt="LinkedIn">
            </a>
            <a href="https://facebook.com/wholesalepayments" style="text-decoration:none;margin-right:4px;">
              <img src="https://cdn-icons-png.flaticon.com/16/174/174848.png" width="16" height="16" alt="Facebook">
            </a>
            <a href="https://tiktok.com/@wholesalepayments" style="text-decoration:none;margin-right:4px;">
              <img src="https://cdn-icons-png.flaticon.com/16/3046/3046121.png" width="16" height="16" alt="TikTok">
            </a>
            <a href="https://youtube.com/@wholesalepayments" style="text-decoration:none;margin-right:4px;">
              <img src="https://cdn-icons-png.flaticon.com/16/1384/1384060.png" width="16" height="16" alt="YouTube">
            </a>
            <a href="https://instagram.com/wholesalepayments" style="text-decoration:none;">
              <img src="https://cdn-icons-png.flaticon.com/16/2111/2111463.png" width="16" height="16" alt="Instagram">
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom:10px;color:#666;">Account Manager</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0;height:2px;">
            <div style="background:linear-gradient(to right,#2563EB,#16A34A);height:2px;width:100%;"></div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="height:6px;"></td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom:4px;">
            📞 813-790-8810 &nbsp;&nbsp; 🌐 <a href="https://wholesalepayments.com" style="color:#1a1a1a;text-decoration:none;">wholesalepayments.com</a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom:4px;">
            ✉ <a href="mailto:jerry.white@wholesalepayments.com" style="color:#1a1a1a;text-decoration:none;">jerry.white@wholesalepayments.com</a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom:10px;">
            📍 7602 University Ave, Lubbock, TX 79423
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0;height:2px;">
            <div style="background:linear-gradient(to right,#2563EB,#16A34A);height:2px;width:100%;"></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

export function getSignature(arm: string): string {
  if (arm === 'bridge-video') return BRIDGE_VIDEO_SIGNATURE
  if (arm === 'wholesale-payments') return WHOLESALE_PAYMENTS_SIGNATURE
  return CONSULTING_SIGNATURE // consulting + access default
}

export function buildHtmlEmail(plainTextBody: string, arm: string): string {
  const paragraphs = plainTextBody
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:600px;margin:0;padding:20px;">
  ${paragraphs}
  ${getSignature(arm)}
</body>
</html>`
}
