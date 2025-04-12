import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Payment {
  paymentId: number;
  purchaseDate: string;
  paymentMethod: string;
  courseTitle: string;
  coursePrice: number;
}

interface UserData {
  id: string;
  // Add other user data properties as needed
}

@Component({
  selector: 'app-payment-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-info.component.html',
  styleUrl: './payment-info.component.css'
})
export class PaymentInfoComponent implements OnInit {
  payments: Payment[] = [];
  studentId: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData: UserData = JSON.parse(userDataString);
      this.studentId = userData.id;
      this.fetchPayments();
    } else {
      console.error('User data not found in localStorage');
    }
  }

  fetchPayments() {
    this.http.get<Payment[]>(`https://est.runasp.net/api/Student/${this.studentId}/mypayment`)
      .subscribe({
        next: (data) => {
          this.payments = data;
        },
        error: (error) => {
          console.error('Error fetching payments:', error);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
