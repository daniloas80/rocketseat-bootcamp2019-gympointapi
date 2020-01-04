import { Op } from 'sequelize';
import * as Yup from 'yup';
import Students from '../models/Students';

class StudentsController {
  async index(req, res) {
    // Se o usuário estiver tentando fazer uma edição, a rota virá com o parâmentro
    // id preenchido, caso contrário, o usuário estará na página principal listando todos.
    const student_id = req.params.id;

    if (student_id > 0) {
      const students = await Students.findByPk(student_id);
      if (Object.keys(students).length >= 1) {
        return res.json(students);
      }
    }

    const whereLike = req.query.name ? req.query.name : '';

    const students = await Students.findAll({
      where: {
        name: {
          [Op.like]: `%${whereLike}%`
        }
      },
      order: [['name', 'ASC']]
    });

    // const students = await Students.findAll();

    if (Object.keys(students).length >= 1) {
      return res.json(students);
    }

    return res.json({ message: 'There is no Student to list' });
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentsExists = await Students.findOne({
      where: { email: req.body.email }
    });

    if (studentsExists) {
      return res.status(400).json({ error: 'Student already exists' });
    }

    // desta forma retornamos somente as informações que precisamos para o frontend
    const { id, name, email, age, weight, height } = await Students.create(
      req.body
    );
    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height
    });
  }

  async update(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string()
        .email()
        .when('oldEmail', (oldEmail, field) =>
          oldEmail ? field.required() : field
        )
      // email: Yup.string().email()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email } = req.body;
    // console.log(Students);

    const student = await Students.findByPk(req.params.id);

    if (email !== student.email) {
      const userExists = await Students.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const { id, name, age, weight, height } = await student.update(req.body);
    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height
    });
  }

  async delete(req, res) {
    Students.destroy({
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
export default new StudentsController();
