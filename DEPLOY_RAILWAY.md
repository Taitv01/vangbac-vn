# Hướng dẫn Deploy VàngBạc.VN lên Railway (miễn phí)

## Tổng quan kiến trúc

```
[Railway Server]
  ├── Express backend (Node.js)  → API, auth, dữ liệu
  └── Vite frontend (React)      → Giao diện người dùng
       └── dist/public/           → Static files được serve bởi Express

[Người dùng cài app]
  Browser → Add to Home Screen → PWA icon trên màn hình chính
```

---

## Bước 1: Tạo tài khoản Railway

1. Vào [railway.app](https://railway.app) → **Sign Up with GitHub**
2. Xác nhận email nếu cần
3. Bạn nhận được **$5 credit miễn phí mỗi tháng** — đủ để chạy app nhỏ liên tục

---

## Bước 2: Push code lên GitHub

```bash
cd /path/to/gold-tracker

# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "Initial commit: VàngBạc.VN with auth + PWA"

# Tạo repo trên GitHub rồi push
git remote add origin https://github.com/<your-username>/vangbac-vn.git
git push -u origin main
```

> **Lưu ý:** Không push file `data.json` (đã có trong `.gitignore`). Dữ liệu người dùng sẽ tự tạo khi app chạy lần đầu trên Railway.

---

## Bước 3: Tạo Project trên Railway

1. Vào **[railway.app/dashboard](https://railway.app/dashboard)**
2. Click **New Project** → **Deploy from GitHub repo**
3. Chọn repo `vangbac-vn`
4. Railway tự phát hiện `Dockerfile` → tự build

---

## Bước 4: Cấu hình Environment Variables

Vào **Settings → Variables** của service, thêm 3 biến:

| Variable | Value | Ghi chú |
|---|---|---|
| `NODE_ENV` | `production` | Bắt buộc |
| `PORT` | `5000` | Port mà Express lắng nghe |
| `JWT_SECRET` | _(chuỗi ngẫu nhiên 32+ ký tự)_ | **Tạo ngay bên dưới** |

**Tạo JWT_SECRET:**
```bash
# Chạy lệnh này để tạo secret ngẫu nhiên an toàn:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Kết quả ví dụ: a3f8c2d1e9b7...
```

---

## Bước 5: Cấu hình Build & Start

Railway đọc từ `railway.toml` đã có trong project:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/index.cjs"
healthcheckPath = "/api/prices"
```

Không cần thay đổi gì thêm.

---

## Bước 6: Deploy

1. Click **Deploy** (Railway tự động chạy sau mỗi `git push`)
2. Xem logs trong tab **Deployments** → chờ khoảng 2-3 phút
3. Sau khi thành công, click vào **Settings → Networking → Generate Domain**
4. Bạn nhận được URL dạng: `https://vangbac-vn-production.up.railway.app`

---

## Bước 7: Cài PWA trên điện thoại

### iOS (Safari)
1. Mở URL Railway trên Safari
2. Nhấn icon **Chia sẻ** (hình vuông + mũi tên lên)
3. Chọn **"Thêm vào Màn hình chính"**
4. Đặt tên → **Thêm**

### Android (Chrome)
1. Mở URL Railway trên Chrome
2. Chrome tự hiện banner **"Thêm VàngBạc.VN vào màn hình chính"**
3. Hoặc: menu 3 chấm → **"Thêm vào màn hình chính"**

App sẽ hiện như native app, mở toàn màn hình không có thanh URL.

---

## Bước 8: Tự động cập nhật

Mỗi khi bạn push code mới:
```bash
git add .
git commit -m "Update: ..."
git push origin main
```

Railway tự động rebuild và deploy trong ~2-3 phút. Người dùng cài PWA sẽ tự nhận bản mới khi mở app lần tiếp theo (service worker tự refresh cache).

---

## Cấu trúc dữ liệu (data.json)

Railway lưu `data.json` trong container. **Lưu ý quan trọng:**
- Mỗi lần Railway **redeploy**, dữ liệu **có thể bị mất** (container mới)
- Để dữ liệu bền vững, Railway cần **Persistent Volume** ($0.25/GB/tháng)

### Thêm Persistent Volume (khuyến nghị cho production):
1. Railway Dashboard → Service → **Volumes** → **Add Volume**
2. Mount path: `/app/data`
3. Cập nhật `Dockerfile`: đảm bảo `data.json` được ghi vào `/app/data/data.json`

Hoặc nâng cấp lên PostgreSQL/SQLite với Railway PostgreSQL service.

---

## Troubleshooting

| Lỗi | Giải pháp |
|---|---|
| `JWT_SECRET not set` | Kiểm tra Variables đã thêm `JWT_SECRET` |
| Port không nhận | Đảm bảo `PORT=5000` trong Variables |
| Build thất bại | Xem logs trong Deployments, thường là thiếu dependency |
| `data.json` bị mất sau redeploy | Thêm Persistent Volume như hướng dẫn trên |

---

## Chi phí ước tính

| Dịch vụ | Chi phí |
|---|---|
| Railway Hobby Plan | $5/tháng (có $5 credit miễn phí) |
| Persistent Volume (tùy chọn) | ~$0.25/GB/tháng |
| **Tổng** | **$0 - $5.25/tháng** |

Với $5 credit miễn phí, app nhỏ có thể chạy **hoàn toàn miễn phí**.
