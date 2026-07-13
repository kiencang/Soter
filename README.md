# Soter
Ứng dụng mô phỏng điểm mù của xe tải, container. Dự án đang trong giai đoạn **phát triển & thử nghiệm**.

## Mô tả
Xe tải lớn, xe container có những điểm mù khiến cho người lái xe không thể quan sát các phương tiện khác ngay cả khi nhìn qua gương chiếu hậu.

Người lái các phương tiện nhỏ (như xe máy, xe đạp) hoặc đi bộ nếu không nhận thức được các điểm mù này có thể đi vào các điểm mù đó nhưng lại giả định sai lầm rằng tài xế xe tải lớn nhìn thấy mình. Điều này có thể dẫn đến nguy cơ tai nạn nghiêm trọng trong một số tình huống.

Ứng dụng này bên cạnh điểm nhìn toàn cảnh, nó mô phỏng điểm nhìn của tài xế xe tải, giúp người lái xe nhỏ, người đi bộ ý thức được tốt hơn điểm mù của xe tải lớn.

## Thông báo lỗi `Không Hỗ Trợ WebGL`

Nếu bạn nhận được thông báo này khi chạy ứng dụng:

> Trình duyệt hoặc phần cứng của bạn hiện tại không hỗ trợ WebGL đồ họa 3D (hoặc tính năng tăng tốc phần cứng bị tắt). Để có thể trải nghiệm đầy đủ mô phỏng 3D trực quan này, vui lòng bật 'Tăng tốc phần cứng' trong cài đặt trình duyệt hoặc sử dụng một trình duyệt hiện đại khác.

Thì có thể do trình duyệt đang hạn chế khả năng dùng GPU của ứng dụng (ví dụ do các tab khác đang bật đang sử dụng GPU tương đối nhiều). Cách đơn giản nhất là tắt các tab trình duyệt khác đi, và tải lại trang web của ứng dụng Soter.

## Lưu ý
Mặc dù người phát triển ứng dụng này có tham khảo các tài liệu về điểm mù xe tải, cũng như khảo sát nhiều video tai nạn do điểm mù để mô phỏng được chính xác. Nó không đảm bảo rằng việc mô phỏng là chính xác 100%.

Diện tích và vị trí giới hạn của điểm mù thay đổi khá nhiều tùy thuộc vào nhiều yếu tố khác nhau, chẳng hạn như: kích cỡ xe tải, chiều cao xe, kích cỡ gương, và góc gương. Do vậy bạn không nên mặc định mô phỏng điểm mù trên ứng dụng khớp chính xác với mọi loại xe tải mà bạn thấy ngoài đời thực. **Xe tải ngoài đời thực có thể có điểm mù lớn hơn ứng dụng này mô phỏng**.

## Tuyên bố từ chối trách nhiệm
Ứng dụng này chỉ là một mô phỏng, nó **không khớp 100% thực tế**, chỉ dùng nó như công cụ tham khảo.

Soter và người phát triển nó không đưa ra bất kỳ bảo đảm rõ ràng hay ngụ ý nào, cũng như không tuyên bố rằng công cụ sẽ vận hành hoàn hảo, chính xác hoặc cập nhật. Người phát triển sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh trực tiếp hoặc gián tiếp liên quan đến hoặc phát sinh từ việc sử dụng công cụ này.
