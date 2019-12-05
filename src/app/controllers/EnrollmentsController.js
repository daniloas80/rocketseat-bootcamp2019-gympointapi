import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, addMonths } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Students from '../models/Students';
import Plans from '../models/Plans';
import Enrollments from '../models/Enrollments';

class EnrollmentsController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const enrollments = await Enrollments.findAll({
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Students,
          as: 'students',
          attributes: ['id', 'name']
        },
        {
          model: Plans,
          as: 'plans',
          attributes: ['id', 'title']
        }
      ]
    });

    if (enrollments.length >= 1) {
      return res.json(enrollments);
    }
    return res.json({ message: 'There is no Enrollments to list' });
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(start_date));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    // Verifica se o id do estudante passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // Verifica se o id do plano passado exite na base de dados
    const plan = await Plans.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    // preço a pagar conforme a duração do plano
    const payPrice = plan.price * plan.duration;
    const end_date = addMonths(parseISO(start_date), plan.duration);

    // desta forma retornamos somente as informações que precisamos para o frontend
    const { name, title } = await Enrollments.create({
      student_id,
      plan_id,
      start_date: parseISO(start_date),
      end_date,
      price: payPrice
    });

    // const {
    //   student_id,
    //   plan_id,
    //   end_date,
    //   price
    // } = await Enrollments.create(req.body);

    return res.json({
      student_id,
      name: student.name,
      plan_id,
      title: plan.title,
      start_date,
      end_date,
      payPrice
    });
  }

  async update(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .min(1)
        .positive()
        .required(),
      price: Yup.number()
        .min(0)
        .positive()
        .required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title } = req.body;
    // // console.log(Students);

    const plan = await Enrollments.findByPk(req.params.id);

    if (title !== plan.title) {
      const planExists = await Enrollments.findOne({ where: { title } });

      if (planExists) {
        return res.status(400).json({ error: 'Plan already exists' });
      }
    }

    const { id, duration, price } = await plan.update(req.body);
    return res.json({
      id,
      title,
      duration,
      price
    });
  }

  async delete(req, res) {
    Enrollments.destroy({
      where: {
        id: req.params.id
      }
    })
      .then(function checkDeleted(deletedRecord) {
        if (deletedRecord === 1) {
          res.status(200).json({ message: 'Deleted successfully' });
        }
        res.status(404).json({ message: 'Record not found' });
      })
      .catch(function checkError(error) {
        res.status(500).json(error);
      });
  }
}
export default new EnrollmentsController();
