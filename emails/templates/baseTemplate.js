const baseTemplate = ({ title, bodyHtml, storeName = "Subaasan Naturals" }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background-color:#2f5233;padding:20px 32px;">
                <h1 style="color:#ffffff;font-size:20px;margin:0;">${storeName}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#333333;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f0f0eb;padding:16px 32px;text-align:center;color:#888888;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export default baseTemplate;
