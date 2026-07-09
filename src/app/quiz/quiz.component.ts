import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorService } from '../simulator.service';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizComponent {
  sim = inject(SimulatorService);

  // Quiz state
  quizQuestion = signal<number>(1);
  quizAnswered = signal<boolean>(false);
  quizSelectedOption = signal<number | null>(null);
  quizIsCorrect = signal<boolean>(false);
  quizExplanation = signal<string>('');
  quizScore = signal<number>(0);

  selectQuizOption(index: number) {
    if (this.quizAnswered()) return;
    this.quizSelectedOption.set(index);
    this.quizAnswered.set(true);

    const question = this.quizQuestion();
    if (question === 1) {
      if (index === 1) {
        this.quizIsCorrect.set(true);
        this.quizExplanation.set('Chính xác! Bên hông phải là điểm mù rộng nhất và nguy hiểm nhất do khoảng cách từ ghế lái (bên trái) đến gương phụ bên phải rất xa và bị khuất bởi thân xe container.');
        this.quizScore.update(s => s + 10);
      } else {
        this.quizIsCorrect.set(false);
        this.quizExplanation.set('Sai rồi! Điểm mù nguy hiểm nhất là Bên hông phải (Bên phụ). Đây là khu vực khuất tầm nhìn lớn nhất của xe container mà tài xế khó lòng quan sát đầy đủ.');
      }
    } else if (question === 2) {
      if (index === 0) {
        this.quizIsCorrect.set(true);
        this.quizExplanation.set('Hoàn toàn chính xác! Nguyên tắc cơ bản: Nếu bạn không thấy gương chiếu hậu của cabin xe tải lớn, có nghĩa là tài xế chắc chắn không nhìn thấy bạn.');
        this.quizScore.update(s => s + 10);
      } else {
        this.quizIsCorrect.set(false);
        this.quizExplanation.set('Chưa chính xác! Thấy gương chiếu hậu của họ là cách duy nhất đảm bảo bạn nằm ngoài điểm mù và tài xế có cơ hội thấy bạn.');
      }
    } else if (question === 3) {
      if (index === 2) {
        this.quizIsCorrect.set(true);
        this.quizExplanation.set('Tuyệt vời! Giữ khoảng cách ít nhất 15-20 mét (hoặc chiều dài 1 chiếc container) cho bạn tầm quan sát bao quát và dư dả thời gian phanh khi xe trước thắng gấp.');
        this.quizScore.update(s => s + 10);
      } else {
        this.quizIsCorrect.set(false);
        this.quizExplanation.set('Sai rồi! 5 mét là quá sát, bạn sẽ nằm gọn trong điểm mù sau đuôi và không kịp phản ứng nếu xe container phanh khẩn cấp.');
      }
    }
  }

  nextQuizQuestion() {
    this.quizQuestion.update(q => q === 3 ? 1 : q + 1);
    this.quizAnswered.set(false);
    this.quizSelectedOption.set(null);
    this.quizIsCorrect.set(false);
    this.quizExplanation.set('');
  }
}
