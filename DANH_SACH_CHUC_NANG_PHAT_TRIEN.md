# DANH SÁCH CHỨC NĂNG CẦN PHÁT TRIỂN
## Hệ thống quản lý cửa hàng tạp hóa - Business Buddy

---

## 📋 MỤC LỤC
1. [Quản lý nhập hàng (Purchase Orders)](#1-quản-lý-nhập-hàng-purchase-orders)
2. [Quản lý tồn kho nâng cao](#2-quản-lý-tồn-kho-nâng-cao)
3. [Quản lý kho hàng](#3-quản-lý-kho-hàng)
4. [Quản lý đơn hàng bán](#4-quản-lý-đơn-hàng-bán)
5. [Hệ thống POS nâng cao](#5-hệ-thống-pos-nâng-cao)
6. [Quản lý công nợ](#6-quản-lý-công-nợ)
7. [Báo cáo và thống kê](#7-báo-cáo-và-thống-kê)
8. [Quản lý sản phẩm nâng cao](#8-quản-lý-sản-phẩm-nâng-cao)
9. [Hệ thống người dùng và phân quyền](#9-hệ-thống-người-dùng-và-phân-quyền)
10. [Tích hợp và tiện ích](#10-tích-hợp-và-tiện-ích)

---

## 1. QUẢN LÝ NHẬP HÀNG (PURCHASE ORDERS)

### 1.1. Quản lý đơn nhập hàng
- [ ] **Tạo đơn nhập hàng mới** ⚠️ (Chỉ có entity PurchaseOrder, chưa có UI/Controller)
  - Chọn nhà cung cấp
  - Thêm sản phẩm vào đơn (tìm kiếm, quét barcode)
  - Nhập số lượng, đơn giá, chiết khấu
  - Tính toán tự động: tổng tiền, thuế (nếu có)
  - Chọn phương thức thanh toán
  - Ngày dự kiến giao hàng
  - Ghi chú

- [ ] **Danh sách đơn nhập hàng**
  - Lọc theo: trạng thái, nhà cung cấp, khoảng thời gian
  - Tìm kiếm theo mã đơn, nhà cung cấp
  - Sắp xếp theo ngày, giá trị
  - Hiển thị: mã đơn, nhà cung cấp, tổng tiền, trạng thái, ngày tạo

- [ ] **Chi tiết đơn nhập hàng**
  - Xem toàn bộ thông tin đơn
  - Danh sách sản phẩm trong đơn
  - Lịch sử cập nhật trạng thái
  - In phiếu nhập hàng

- [ ] **Cập nhật trạng thái đơn**
  - Nháp → Đã đặt hàng
  - Đã đặt → Đã nhận (một phần/toàn bộ)
  - Hủy đơn
  - Tự động cập nhật tồn kho khi nhận hàng

- [ ] **Chỉnh sửa đơn nhập hàng**
  - Chỉnh sửa khi ở trạng thái Nháp
  - Thêm/xóa/sửa sản phẩm
  - Cập nhật thông tin thanh toán

- [ ] **Xóa đơn nhập hàng**
  - Chỉ xóa được khi ở trạng thái Nháp hoặc Đã hủy

### 1.2. Nhận hàng và cập nhật tồn kho
- [ ] **Nhận hàng từ đơn nhập**
  - Chọn kho nhận hàng
  - Nhập số lượng thực tế nhận (có thể khác số lượng đặt)
  - Kiểm tra chất lượng hàng hóa
  - Nhập hạn sử dụng (nếu có)
  - Tự động tạo StockBatch (lô hàng) cho FIFO
  - Tự động cập nhật tồn kho
  - Tự động tạo StockTransaction

- [ ] **Nhận hàng một phần**
  - Cho phép nhận nhiều lần từ một đơn
  - Theo dõi số lượng đã nhận vs đã đặt
  - Cập nhật trạng thái đơn tự động

### 1.3. Thanh toán đơn nhập hàng
- [ ] **Quản lý thanh toán**
  - Thanh toán toàn bộ
  - Thanh toán một phần (trả góp)
  - Theo dõi số tiền đã trả, còn nợ
  - Tự động tạo CashbookEntry khi thanh toán

- [ ] **Lịch sử thanh toán**
  - Xem tất cả các lần thanh toán của đơn
  - In phiếu thanh toán

---

## 2. QUẢN LÝ TỒN KHO NÂNG CAO

### 2.1. Quản lý tồn kho theo kho
- [x] **Xem tồn kho theo kho hàng** ✅ (Có trong trang Inventory, hiển thị currentStock)
  - [ ] Danh sách sản phẩm trong từng kho (chưa phân biệt kho)
  - [x] Số lượng tồn, vị trí kệ (shelf location) - có số lượng, chưa có vị trí kệ
  - [ ] Giá trị tồn kho
  - [x] Lọc theo kho, danh mục, trạng thái - có lọc theo danh mục

- [ ] **Chuyển kho (Stock Transfer)**
  - Chuyển hàng giữa các kho
  - Tạo phiếu chuyển kho
  - Cập nhật tồn kho tự động
  - Theo dõi lịch sử chuyển kho

### 2.2. Điều chỉnh tồn kho
- [ ] **Tạo phiếu điều chỉnh**
  - Điều chỉnh tăng (kiểm kê thừa, hàng trả về)
  - Điều chỉnh giảm (hao hụt, hỏng, mất)
  - Lý do điều chỉnh
  - Phê duyệt điều chỉnh (nếu cần)
  - Tự động tạo StockTransaction

- [ ] **Kiểm kê kho (Stocktaking)**
  - Tạo phiếu kiểm kê
  - Nhập số lượng thực tế
  - So sánh với số lượng hệ thống
  - Tự động tạo phiếu điều chỉnh từ chênh lệch
  - In bảng kiểm kê

### 2.3. Quản lý lô hàng (Stock Batch) - FIFO/LIFO
- [ ] **Theo dõi lô hàng**
  - Xem danh sách lô hàng của sản phẩm
  - Hạn sử dụng (expiry date)
  - Số lượng còn lại trong lô
  - Cảnh báo sắp hết hạn

- [ ] **Tự động xuất kho theo FIFO**
  - Khi bán hàng, tự động xuất từ lô cũ nhất
  - Cảnh báo khi sắp hết hạn

- [ ] **Quản lý hàng hết hạn**
  - Danh sách hàng đã hết hạn
  - Cảnh báo hàng sắp hết hạn (7 ngày, 30 ngày)
  - Xử lý hàng hết hạn (hủy, trả nhà cung cấp)

### 2.4. Lịch sử giao dịch tồn kho
- [ ] **Xem lịch sử StockTransaction**
  - Lọc theo: sản phẩm, kho, loại giao dịch, khoảng thời gian
  - Loại giao dịch: Nhập, Xuất, Điều chỉnh, Chuyển kho
  - Tham chiếu đến đơn hàng (SaleOrder, PurchaseOrder)

### 2.5. Định giá tồn kho
- [ ] **Phương pháp định giá**
  - FIFO (First In First Out)
  - LIFO (Last In First Out)
  - Bình quân gia quyền (Weighted Average)
  - Cấu hình phương pháp cho từng sản phẩm

- [ ] **Báo cáo giá trị tồn kho**
  - Giá trị tồn kho theo phương pháp đã chọn
  - Báo cáo theo kho, danh mục

---

## 3. QUẢN LÝ KHO HÀNG

### 3.1. CRUD kho hàng
- [ ] **Tạo kho hàng mới** ⚠️ (Chỉ có entity Warehouse, chưa có UI/Controller)
  - [ ] Mã kho, tên kho
  - [ ] Địa chỉ, số điện thoại
  - [ ] Đặt làm kho mặc định

- [ ] **Danh sách kho hàng** ⚠️ (Chỉ có entity, chưa có UI)
  - [ ] Xem tất cả kho
  - [ ] Lọc kho đang hoạt động/ngừng hoạt động
  - [ ] Thống kê số lượng sản phẩm, giá trị tồn kho

- [ ] **Chỉnh sửa/Xóa kho** ⚠️ (Chưa có UI)
  - [ ] Chỉnh sửa thông tin kho
  - [ ] Xóa kho (chỉ khi không còn tồn kho)

### 3.2. Quản lý vị trí kệ (Shelf Location)
- [ ] **Gán vị trí kệ cho sản phẩm**
  - Mỗi sản phẩm trong kho có vị trí kệ
  - Tìm kiếm sản phẩm theo vị trí
  - In nhãn vị trí

---

## 4. QUẢN LÝ ĐƠN HÀNG BÁN

### 4.1. Danh sách đơn hàng bán
- [x] **Xem danh sách đơn hàng** ✅ (Có API getSaleOrders, hiển thị trong RecentOrders)
  - [x] Lọc theo: trạng thái, khách hàng, khoảng thời gian, phương thức thanh toán
  - [x] Tìm kiếm theo mã đơn, tên khách hàng
  - [x] Sắp xếp theo ngày, giá trị
  - [x] Hiển thị: mã đơn, khách hàng, tổng tiền, trạng thái, ngày tạo

### 4.2. Chi tiết đơn hàng
- [x] **Xem chi tiết đơn** ✅ (Hiển thị trong receipt dialog sau khi thanh toán)
  - [x] Thông tin đơn hàng đầy đủ
  - [x] Danh sách sản phẩm
  - [x] Thông tin thanh toán
  - [ ] Lịch sử cập nhật

- [x] **In hóa đơn/biên lai** ✅ (Có nút in trong receipt dialog)
  - [x] In hóa đơn bán hàng
  - [ ] Tùy chỉnh mẫu in
  - [x] In lại hóa đơn

### 4.3. Quản lý trạng thái đơn
- [x] **Cập nhật trạng thái** ✅ (Có tạo đơn với status Completed/Draft từ POS)
  - [x] Nháp → Hoàn thành - có trong POS
  - [ ] Hủy đơn
  - [ ] Trả hàng/Hoàn tiền
  - [ ] Tự động cập nhật tồn kho khi hủy/trả hàng

- [ ] **Chỉnh sửa đơn hàng** ⚠️ (Chưa có UI để chỉnh sửa đơn đã tạo)
  - [ ] Chỉnh sửa khi ở trạng thái Nháp
  - [ ] Thêm/xóa/sửa sản phẩm
  - [ ] Cập nhật thông tin khách hàng, thanh toán

### 4.4. Trả hàng và hoàn tiền
- [ ] **Tạo đơn trả hàng**
  - Chọn đơn hàng gốc
  - Chọn sản phẩm và số lượng trả
  - Lý do trả hàng
  - Hoàn tiền (toàn bộ/một phần)
  - Tự động cập nhật tồn kho
  - Tự động tạo CashbookEntry

- [ ] **Lịch sử trả hàng**
  - Xem tất cả đơn trả hàng
  - Thống kê tỷ lệ trả hàng

---

## 5. HỆ THỐNG POS NÂNG CAO

### 5.1. Tính năng POS hiện tại cần hoàn thiện
- [ ] **Quét barcode thực tế** ⚠️ (Chỉ có tìm kiếm bằng code/barcode, chưa tích hợp camera)
  - [ ] Tích hợp camera để quét barcode
  - [x] Hỗ trợ nhiều loại barcode (EAN-13, Code 128, QR code) - tìm kiếm bằng code

- [ ] **Xử lý đơn vị tính** ⚠️ (Có unitId nhưng chưa cho phép chọn đơn vị)
  - [ ] Chọn đơn vị tính khi thêm vào giỏ (ví dụ: thùng, lốc, chai)
  - [ ] Tự động chuyển đổi đơn vị
  - [ ] Hiển thị giá theo đơn vị đã chọn

- [x] **Giảm giá linh hoạt** ✅ (Có giảm giá theo % cho toàn đơn)
  - [x] Giảm giá theo % hoặc số tiền (hiện tại chỉ có %)
  - [ ] Giảm giá cho từng sản phẩm
  - [x] Giảm giá cho toàn đơn
  - [ ] Mã giảm giá (voucher/coupon)

### 5.2. Tính năng POS mới
- [ ] **Bán hàng nhanh (Quick Sale)**
  - Màn hình bán hàng tối giản
  - Chỉ hiển thị sản phẩm bán chạy
  - Thanh toán nhanh 1 click

- [ ] **Bán hàng theo combo/bundle**
  - Tạo combo sản phẩm
  - Giá combo (có thể rẻ hơn tổng giá lẻ)
  - Tự động thêm các sản phẩm trong combo vào giỏ

- [x] **Bán hàng cho khách hàng thành viên** ✅ (Có chọn khách hàng, chưa tích điểm tự động)
  - [ ] Tự động áp dụng giảm giá theo hạng thành viên
  - [ ] Tích điểm cho khách hàng
  - [ ] Đổi điểm lấy sản phẩm

- [ ] **Bán hàng trả góp**
  - Chọn phương thức trả góp
  - Tính toán số tiền trả trước, số tiền còn lại
  - Lịch trả góp
  - Theo dõi công nợ

- [ ] **In hóa đơn tự động** ⚠️ (Có nút in, chưa tự động)
  - [ ] Tích hợp máy in nhiệt
  - [ ] In tự động sau khi thanh toán
  - [ ] Tùy chỉnh mẫu in

- [ ] **Lưu đơn tạm (Draft Orders)**
  - Lưu đơn hàng chưa thanh toán
  - Khôi phục đơn tạm
  - Xóa đơn tạm

- [ ] **Bán hàng offline**
  - Hoạt động khi mất kết nối internet
  - Đồng bộ dữ liệu khi có kết nối lại

---

## 6. QUẢN LÝ CÔNG NỢ

### 6.1. Công nợ khách hàng (Receivables)
- [ ] **Danh sách công nợ khách hàng**
  - Xem công nợ của từng khách hàng
  - Lọc theo: khách hàng, trạng thái, khoảng thời gian
  - Cảnh báo công nợ quá hạn

- [ ] **Thu tiền công nợ**
  - Tạo phiếu thu
  - Ghi nhận thanh toán từng phần/toàn bộ
  - Tự động cập nhật công nợ
  - Tự động tạo CashbookEntry

- [ ] **Lịch sử công nợ**
  - Xem lịch sử phát sinh công nợ
  - Lịch sử thanh toán
  - Báo cáo công nợ theo thời gian

- [ ] **Cảnh báo công nợ**
  - Cảnh báo công nợ sắp đến hạn
  - Cảnh báo công nợ quá hạn
  - Gửi thông báo (SMS, Email, Zalo)

### 6.2. Công nợ nhà cung cấp (Payables)
- [ ] **Danh sách công nợ nhà cung cấp**
  - Xem công nợ của từng nhà cung cấp
  - Lọc theo: nhà cung cấp, trạng thái, khoảng thời gian
  - Cảnh báo công nợ đến hạn thanh toán

- [ ] **Trả tiền công nợ**
  - Tạo phiếu chi
  - Ghi nhận thanh toán từng phần/toàn bộ
  - Tự động cập nhật công nợ
  - Tự động tạo CashbookEntry

- [ ] **Lịch sử công nợ**
  - Xem lịch sử phát sinh công nợ
  - Lịch sử thanh toán
  - Báo cáo công nợ theo thời gian

- [ ] **Cảnh báo công nợ**
  - Cảnh báo công nợ sắp đến hạn
  - Cảnh báo công nợ quá hạn

### 6.3. Báo cáo công nợ
- [ ] **Báo cáo tổng hợp công nợ**
  - Tổng công nợ phải thu
  - Tổng công nợ phải trả
  - Công nợ theo khách hàng/nhà cung cấp
  - Công nợ theo thời gian

---

## 7. BÁO CÁO VÀ THỐNG KÊ

### 7.1. Báo cáo bán hàng
- [x] **Báo cáo doanh thu** ✅ (Có revenue by time, revenue by category)
  - [x] Doanh thu theo ngày/tuần/tháng/năm (có revenue by time)
  - [ ] So sánh doanh thu các kỳ
  - [ ] Doanh thu theo nhân viên
  - [ ] Doanh thu theo phương thức thanh toán

- [x] **Báo cáo lợi nhuận** ✅ (Có ước tính lợi nhuận trong Dashboard và Reports)
  - [x] Lợi nhuận gộp (Gross Profit) - ước tính
  - [x] Tỷ suất lợi nhuận - có trong Dashboard
  - [ ] Lợi nhuận theo sản phẩm
  - [ ] Lợi nhuận theo danh mục

- [x] **Báo cáo sản phẩm bán chạy** ✅ (Có TopProducts component và service)
  - [x] Top sản phẩm bán chạy (số lượng, doanh thu)
  - [ ] Sản phẩm bán chậm
  - [ ] Phân tích xu hướng bán hàng

- [ ] **Báo cáo khách hàng**
  - Top khách hàng mua nhiều nhất
  - Phân tích hành vi mua hàng
  - Khách hàng mới, khách hàng cũ

### 7.2. Báo cáo tồn kho
- [x] **Báo cáo tồn kho hiện tại** ✅ (Có trong trang Inventory)
  - [ ] Tồn kho theo kho
  - [x] Tồn kho theo danh mục - có filter
  - [ ] Giá trị tồn kho
  - [x] Sản phẩm sắp hết, đã hết - có hiển thị và cảnh báo

- [ ] **Báo cáo nhập xuất tồn (NXT)**
  - Nhập kho trong kỳ
  - Xuất kho trong kỳ
  - Tồn đầu kỳ, tồn cuối kỳ
  - Theo dõi theo sản phẩm, danh mục

- [ ] **Báo cáo vòng quay hàng hóa**
  - Tỷ lệ vòng quay hàng hóa (Turnover Rate)
  - Sản phẩm quay vòng nhanh/chậm
  - Phân tích hiệu quả kinh doanh

- [ ] **Báo cáo hàng hết hạn**
  - Danh sách hàng đã hết hạn
  - Hàng sắp hết hạn (7, 30 ngày)
  - Giá trị hàng hết hạn

### 7.3. Báo cáo nhập hàng
- [ ] **Báo cáo nhập hàng**
  - Tổng giá trị nhập hàng theo kỳ
  - Nhập hàng theo nhà cung cấp
  - Nhập hàng theo sản phẩm/danh mục
  - So sánh nhập hàng các kỳ

### 7.4. Báo cáo tài chính
- [x] **Báo cáo thu chi** ✅ (Có trong trang Cashbook)
  - [x] Thu chi theo ngày/tuần/tháng - có filter
  - [x] Thu chi theo danh mục - có category
  - [x] Số dư quỹ - có hiển thị balance
  - [ ] Dòng tiền (Cash Flow)

- [ ] **Báo cáo lãi lỗ**
  - Báo cáo kết quả kinh doanh (P&L)
  - Doanh thu, chi phí, lợi nhuận
  - Theo dõi theo thời gian

### 7.5. Báo cáo thuế
- [x] **Báo cáo thuế HKD** ✅ (Có trong trang Reports - tab Thuế HKD)
  - [x] Tính thuế GTGT, thuế TNCN
  - [x] Báo cáo theo quý, năm - có tính toán
  - [ ] Xuất file Excel để nộp thuế

- [x] **Báo cáo lệ phí môn bài** ✅ (Có trong Reports)
  - [x] Tính lệ phí môn bài theo doanh thu
  - [ ] Cảnh báo thời hạn nộp

### 7.6. Xuất báo cáo
- [ ] **Xuất file Excel**
  - Tất cả các loại báo cáo
  - Tùy chỉnh định dạng

- [ ] **Xuất file PDF**
  - Báo cáo định dạng PDF
  - In trực tiếp từ trình duyệt

- [ ] **Gửi báo cáo qua email**
  - Lên lịch gửi báo cáo tự động
  - Gửi báo cáo theo email đã cấu hình

---

## 8. QUẢN LÝ SẢN PHẨM NÂNG CAO

### 8.1. Quản lý đơn vị tính
- [ ] **Chuyển đổi đơn vị tính** ⚠️ (Có entity ProductUnitConversion, chưa có UI)
  - [ ] Cấu hình tỷ lệ chuyển đổi giữa các đơn vị
  - [ ] Ví dụ: 1 thùng = 24 chai, 1 lốc = 6 chai
  - [ ] Tự động tính giá khi chuyển đổi

- [x] **Đơn vị tính cơ sở và đơn vị bán** ✅ (Có baseUnitId và unitId trong Product)
  - [x] Đơn vị tính cơ sở (Base Unit): chai, gói, kg - có baseUnitId
  - [x] Đơn vị tính bán (Sale Unit): thùng, lốc, hộp - có unitId
  - [ ] Quản lý giá theo từng đơn vị

### 8.2. Quản lý combo/bundle
- [ ] **Tạo combo sản phẩm** ⚠️ (Chỉ có entity ComboItem, chưa có UI)
  - [ ] Chọn các sản phẩm trong combo
  - [ ] Số lượng mỗi sản phẩm
  - [ ] Giá combo (có thể rẻ hơn tổng giá lẻ)
  - [ ] Hình ảnh combo

- [ ] **Quản lý combo** ⚠️ (Chưa có UI)
  - [ ] Danh sách combo
  - [ ] Chỉnh sửa, xóa combo
  - [ ] Kích hoạt/vô hiệu hóa combo

### 8.3. Quản lý giá
- [ ] **Lịch sử thay đổi giá**
  - Theo dõi mọi thay đổi giá
  - Xem lịch sử giá vốn, giá bán
  - So sánh giá các thời điểm

- [ ] **Quản lý giá theo khách hàng**
  - Giá riêng cho từng khách hàng
  - Giá theo hạng thành viên
  - Giá sỉ, giá lẻ

- [ ] **Quản lý giá theo số lượng**
  - Giá bán theo số lượng (volume pricing)
  - Ví dụ: 1-10 cái: 10k, 11-50 cái: 9k, >50 cái: 8k

### 8.4. Quản lý barcode
- [ ] **Tạo barcode tự động**
  - Tự động tạo barcode cho sản phẩm
  - Hỗ trợ nhiều định dạng (EAN-13, Code 128)

- [ ] **In nhãn barcode**
  - In nhãn barcode cho sản phẩm
  - Tùy chỉnh mẫu nhãn
  - In hàng loạt

### 8.5. Quản lý hình ảnh
- [x] **Upload nhiều hình ảnh** ✅ (Có API upload image, hiện tại chỉ 1 ảnh)
  - [ ] Hỗ trợ nhiều hình ảnh cho một sản phẩm
  - [x] Hình ảnh chính, hình ảnh phụ - có imageUrl và thumbnailUrl
  - [x] Tối ưu hóa hình ảnh tự động - có thumbnail

- [ ] **Quản lý thư viện hình ảnh**
  - Xem tất cả hình ảnh sản phẩm
  - Tìm kiếm hình ảnh
  - Xóa hình ảnh không sử dụng

---

## 9. HỆ THỐNG NGƯỜI DÙNG VÀ PHÂN QUYỀN

### 9.1. Xác thực người dùng (Authentication)
- [ ] **Đăng nhập/Đăng xuất**
  - Đăng nhập bằng username/password
  - Đăng nhập bằng email
  - Đăng nhập bằng số điện thoại + OTP
  - Đăng nhập bằng Google/Facebook (tùy chọn)
  - Quên mật khẩu, đặt lại mật khẩu

- [ ] **Quản lý phiên đăng nhập**
  - JWT token authentication
  - Refresh token
  - Đăng xuất tất cả thiết bị
  - Theo dõi phiên đăng nhập

### 9.2. Quản lý người dùng
- [ ] **CRUD người dùng**
  - Tạo tài khoản người dùng
  - Chỉnh sửa thông tin
  - Vô hiệu hóa/kích hoạt tài khoản
  - Xóa tài khoản

- [ ] **Phân quyền người dùng**
  - Vai trò (Role): Admin, Manager, Cashier, Staff
  - Quyền (Permission) chi tiết:
    - Xem/Sửa/Xóa sản phẩm
    - Xem/Sửa/Xóa đơn hàng
    - Xem/Sửa báo cáo
    - Quản lý người dùng
    - Quản lý cài đặt hệ thống

- [ ] **Quản lý vai trò**
  - Tạo vai trò mới
  - Gán quyền cho vai trò
  - Chỉnh sửa, xóa vai trò

### 9.3. Quản lý ca làm việc
- [ ] **Tạo ca làm việc**
  - Ca sáng, ca chiều, ca tối
  - Thời gian bắt đầu, kết thúc

- [ ] **Chấm công**
  - Đăng nhập vào ca
  - Đăng xuất khỏi ca
  - Theo dõi thời gian làm việc
  - Tính lương theo ca (nếu cần)

- [ ] **Báo cáo ca làm việc**
  - Doanh thu theo ca
  - Doanh thu theo nhân viên
  - Thống kê hiệu suất

---

## 10. TÍCH HỢP VÀ TIỆN ÍCH

### 10.1. Nhập/Xuất dữ liệu
- [ ] **Nhập dữ liệu từ Excel**
  - Nhập danh sách sản phẩm
  - Nhập danh sách khách hàng
  - Nhập danh sách nhà cung cấp
  - Nhập tồn kho ban đầu
  - Template Excel mẫu
  - Validate dữ liệu trước khi nhập

- [ ] **Xuất dữ liệu ra Excel**
  - Xuất danh sách sản phẩm
  - Xuất danh sách khách hàng
  - Xuất danh sách nhà cung cấp
  - Xuất báo cáo
  - Tùy chỉnh cột xuất

### 10.2. In ấn
- [ ] **In hóa đơn**
  - Mẫu hóa đơn tùy chỉnh
  - In máy in nhiệt (thermal printer)
  - In máy in thường
  - In lại hóa đơn

- [ ] **In phiếu nhập/xuất**
  - Phiếu nhập hàng
  - Phiếu xuất hàng
  - Phiếu điều chỉnh tồn kho

- [ ] **In nhãn**
  - Nhãn sản phẩm
  - Nhãn barcode
  - Nhãn giá

### 10.3. Tích hợp thanh toán
- [x] **Tích hợp cổng thanh toán** ✅ (Có PaymentQR component, hỗ trợ VietQR, Momo, ZaloPay, BankTransfer)
  - [x] VietQR API - có tạo QR code
  - [x] MoMo API - có hỗ trợ
  - [x] ZaloPay API - có hỗ trợ
  - [x] Ngân hàng (Banking API) - có BankTransfer

- [ ] **Xác nhận thanh toán tự động** ⚠️ (Có QR code nhưng chưa tự động xác nhận)
  - [ ] Webhook từ cổng thanh toán
  - [ ] Tự động cập nhật trạng thái đơn hàng
  - [ ] Thông báo khi nhận được thanh toán

### 10.4. Thông báo
- [ ] **Thông báo trong hệ thống**
  - Thông báo sản phẩm sắp hết
  - Thông báo công nợ đến hạn
  - Thông báo đơn hàng mới
  - Thông báo hệ thống

- [ ] **Gửi thông báo qua SMS**
  - Tích hợp SMS gateway
  - Gửi thông báo công nợ
  - Gửi mã OTP

- [ ] **Gửi thông báo qua Email**
  - Tích hợp SMTP
  - Gửi báo cáo định kỳ
  - Gửi thông báo quan trọng

- [ ] **Gửi thông báo qua Zalo**
  - Tích hợp Zalo OA (Official Account)
  - Gửi thông báo đến khách hàng

### 10.5. Backup và khôi phục
- [ ] **Sao lưu dữ liệu**
  - Backup tự động hàng ngày
  - Backup thủ công
  - Lưu trữ backup trên cloud

- [ ] **Khôi phục dữ liệu**
  - Khôi phục từ backup
  - Chọn thời điểm khôi phục

### 10.6. Cài đặt hệ thống
- [ ] **Cấu hình hệ thống**
  - Thông tin cửa hàng
  - Logo, tên cửa hàng
  - Địa chỉ, liên hệ
  - Mã số thuế

- [ ] **Cấu hình in ấn**
  - Máy in mặc định
  - Kích thước giấy
  - Mẫu in

- [ ] **Cấu hình thông báo**
  - Bật/tắt thông báo
  - Cấu hình email, SMS
  - Cấu hình Zalo OA

- [ ] **Cấu hình tích điểm**
  - Tỷ lệ tích điểm (ví dụ: 1 điểm = 1000đ)
  - Tỷ lệ đổi điểm (ví dụ: 100 điểm = 10.000đ)
  - Quy tắc tích điểm theo hạng thành viên

- [x] **Cấu hình thanh toán** ✅ (Có PaymentSettings, PaymentSettingsDialog)
  - [x] Quản lý thông tin tài khoản thanh toán
  - [x] Cấu hình VietQR, Momo, ZaloPay, BankTransfer

### 10.7. Ứng dụng di động
- [ ] **Ứng dụng POS trên mobile**
  - Bán hàng trên điện thoại/tablet
  - Quét barcode bằng camera
  - Thanh toán nhanh

- [ ] **Ứng dụng quản lý trên mobile**
  - Xem báo cáo
  - Quản lý tồn kho
  - Xem đơn hàng

### 10.8. API và tích hợp bên thứ ba
- [x] **RESTful API** ✅ (Có nhiều controllers: Products, Customers, Suppliers, SaleOrders, Cashbook, Dashboard, PaymentSettings, Categories, UnitOfMeasures, TopProducts)
  - [x] API đầy đủ cho tất cả chức năng - có nhiều endpoints
  - [x] API documentation (Swagger) - có Swagger UI
  - [ ] API versioning

- [ ] **Webhook**
  - Webhook cho các sự kiện quan trọng
  - Tích hợp với hệ thống khác

---

## 📊 TỔNG KẾT

### ✅ CÁC CHỨC NĂNG ĐÃ HOÀN THÀNH

**Quản lý sản phẩm:**
- ✅ CRUD sản phẩm đầy đủ
- ✅ Upload hình ảnh sản phẩm
- ✅ Quản lý danh mục (Categories)
- ✅ Quản lý đơn vị tính (UnitOfMeasures)
- ✅ Xem tồn kho hiện tại

**Quản lý khách hàng & nhà cung cấp:**
- ✅ CRUD khách hàng đầy đủ
- ✅ CRUD nhà cung cấp đầy đủ
- ✅ Hệ thống hạng thành viên (Membership Tier)
- ✅ Theo dõi công nợ cơ bản (receivables, payables)

**Hệ thống POS:**
- ✅ Giao diện POS cơ bản
- ✅ Tạo đơn hàng từ POS
- ✅ Chọn khách hàng
- ✅ Giảm giá theo %
- ✅ Tìm kiếm sản phẩm bằng code/barcode
- ✅ Thanh toán: Tiền mặt, Chuyển khoản, VietQR, Momo, ZaloPay
- ✅ Hiển thị QR code thanh toán
- ✅ In hóa đơn cơ bản

**Quản lý đơn hàng:**
- ✅ Tạo đơn hàng bán (từ POS)
- ✅ Xem danh sách đơn hàng
- ✅ Xem chi tiết đơn hàng

**Sổ quỹ (Cashbook):**
- ✅ CRUD phiếu thu/chi
- ✅ Theo dõi số dư quỹ
- ✅ Lọc theo loại, danh mục, thời gian

**Báo cáo:**
- ✅ Dashboard với thống kê cơ bản
- ✅ Báo cáo doanh thu theo thời gian
- ✅ Báo cáo doanh thu theo danh mục
- ✅ Top sản phẩm bán chạy
- ✅ Báo cáo thuế HKD (tính toán)
- ✅ Báo cáo lệ phí môn bài

**Cài đặt:**
- ✅ Cấu hình thông tin thanh toán (PaymentSettings)
- ✅ Quản lý tài khoản VietQR, Momo, ZaloPay

**API:**
- ✅ RESTful API với nhiều endpoints
- ✅ Swagger documentation

### ⚠️ CÁC CHỨC NĂNG ĐANG PHÁT TRIỂN/CHƯA HOÀN THIỆN

- ⚠️ Quản lý đơn nhập hàng (Purchase Orders) - chỉ có entity, chưa có UI (Đã implement)
- ⚠️ Quản lý tồn kho nâng cao (điều chỉnh, chuyển kho, lô hàng)
- ⚠️ Quản lý kho hàng (chỉ có entity)
- ⚠️ Quản lý đơn hàng bán (chưa có trang quản lý đầy đủ, chỉnh sửa, hủy, trả hàng) (Đã Implement)
- ⚠️ Quét barcode thực tế (chỉ có tìm kiếm bằng code)
- ⚠️ Chuyển đổi đơn vị tính trong POS (Đã Implement)
- ⚠️ Xác nhận thanh toán tự động (chưa có webhook)
- ⚠️ Hệ thống người dùng và phân quyền (chưa có authentication)

### ❌ CÁC CHỨC NĂNG CHƯA PHÁT TRIỂN

- ❌ Quản lý công nợ chi tiết (thu nợ, trả nợ, cảnh báo) (Đã implemet)
- ❌ Trả hàng và hoàn tiền
- ❌ Combo/Bundle sản phẩm
- ❌ Tích điểm và đổi điểm
- ❌ Nhập/Xuất Excel
- ❌ Báo cáo nâng cao (NXT, vòng quay hàng hóa, hàng hết hạn)
- ❌ Quản lý ca làm việc
- ❌ Ứng dụng di động
- ❌ Thông báo (SMS, Email, Zalo)
- ❌ Backup và khôi phục tự động

### Ưu tiên phát triển (Phase 1 - 3 tháng)
1. Quản lý đơn nhập hàng (Purchase Orders) - đầy đủ
2. Quản lý tồn kho nâng cao (Stock Management)
3. Quản lý đơn hàng bán (Sale Orders Management) - hoàn thiện
4. Quản lý công nợ (Receivables & Payables) - chi tiết
5. Báo cáo cơ bản (Basic Reports) - bổ sung
6. Hệ thống người dùng và phân quyền (User & Roles)

### Ưu tiên trung bình (Phase 2 - 3 tháng tiếp theo)
1. POS nâng cao
2. Báo cáo nâng cao
3. Quản lý sản phẩm nâng cao
4. Tích hợp thanh toán
5. Nhập/Xuất Excel

### Ưu tiên thấp (Phase 3 - 3 tháng cuối)
1. Ứng dụng di động
2. Tích hợp thông báo (SMS, Email, Zalo)
3. Backup và khôi phục tự động
4. API và Webhook

---

## 📝 GHI CHÚ

- Danh sách này có thể được cập nhật và bổ sung theo nhu cầu thực tế
- Một số chức năng có thể được tùy chỉnh theo yêu cầu cụ thể của từng cửa hàng
- Ưu tiên phát triển có thể thay đổi dựa trên phản hồi từ người dùng

---

**Ngày tạo:** 2024-12-25  
**Ngày cập nhật:** 2024-12-25  
**Phiên bản:** 1.1  
**Trạng thái:** Đang phát triển

---

## 📌 CHÚ THÍCH ĐÁNH DẤU

- ✅ `[x]` - Chức năng đã hoàn thành
- ⚠️ `[ ]` với ghi chú ⚠️ - Chức năng đang phát triển/chưa hoàn thiện
- ❌ `[ ]` - Chức năng chưa phát triển

**Lưu ý:** Một số chức năng có thể đã được đánh dấu một phần nếu chỉ có backend hoặc chỉ có frontend cơ bản.

