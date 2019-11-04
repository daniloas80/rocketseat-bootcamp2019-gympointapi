// É convencionado deixar as importação de módulos primeiro no código
import jwt from 'jsonwebtoken';

// Usa-se o formato abaixo porque esse pacote chamada Yup não possui "export default"
// O asterisco significa que vai ser importado tudo do pacote e colocado na variável
// O pacote Yup é usado para validação
import * as Yup from 'yup';

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    // Usando o Yup para validar
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Não validado!' });
    }
    // fim da validação

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!(await user.checarSenha(password))) {
      return res.status(401).json({ error: 'Senha não confere' });
    }

    const { id, name } = user;

    // Se passar pelas verificações acima, então retornar as informações do usuário
    return res.json({
      user: {
        id,
        name,
        email
      },
      // Na função sign abaixo, o primeiro parâmetro é o chamado Payload
      // Payload é usado quando se quer reutilzar o token na aplicação
      // Geralmente insere-se uma informação relacionada ao usuário, como a id
      // O segundo parâmetro é um código MD5 único gerado normalmente com um texto aleatório
      // O terceiro parãmetro indica a duração do token (recomendado)
      // Nota: o segundo e o terceiro parâmetros foram incluídos num arquivo importado na linha 5
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn
      })
    });
  }
}

export default new SessionController();
