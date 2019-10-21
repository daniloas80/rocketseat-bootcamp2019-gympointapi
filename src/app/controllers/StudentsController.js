import * as Yup from 'yup';
import Students from '../models/Students';

class StudentsController {
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
}
export default new StudentsController();
