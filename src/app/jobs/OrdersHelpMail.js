import Mail from '../../lib/Mail';

class OrdersHelpMail {
  get key() {
    return 'OrdersHelpMail';
  }

  async handle({ data }) {
    const { student, question, answer } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Gympoint - Você tem uma nova mensagem',
      template: 'ordersHelp',
      context: {
        student: student.name,
        question,
        answer
      }
    });
  }
}

export default new OrdersHelpMail();
