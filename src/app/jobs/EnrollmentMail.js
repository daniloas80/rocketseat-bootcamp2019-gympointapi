import Mail from '../../lib/Mail';

class EnrollmentMail {
  get key() {
    return 'EnrollmentMail';
  }

  async handle({ data }) {
    const {
      student,
      plan,
      formattedStartDay,
      formattedFinalDay,
      formattedPlanPrice,
      formattedPayPrice
    } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Gympoint - Matrícula realizada com sucesso',
      template: 'enrollment',
      context: {
        student: student.name,
        plan: plan.title,
        startDate: formattedStartDay,
        endDate: formattedFinalDay,
        planPrice: formattedPlanPrice,
        payPrice: formattedPayPrice
      }
    });
  }
}

export default new EnrollmentMail();
