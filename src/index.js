const express = require('express');
const { v4: uuidV4 } = require('uuid');

const app = express();

app.use(express.json());

app.listen(3333, () => {
  console.log('Server Started in port: 3333');
});

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const {
    headers: { cpf },
  } = request;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer)
    return response.status(400).json({ message: 'customer not found' });

  request.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    return operation.type === 'credit'
      ? acc + operation.amount
      : acc - operation.amount;
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const {
    capital = 'não informado',
    body: { name, cpf },
  } = request;
  console.log('capital::', capital);

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists)
    return response.status(400).json({
      message: 'customer already exists',
    });

  customers.push({
    id: uuidV4(),
    cpf,
    name,
    statement: [],
  });

  return response.status(201).send();
});

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  // Deconstruction in JS clean code: https://www.youtube.com/watch?v=_17mgcmmHFU&list=LL&index=1 😊
  const {
    customer,
    body: { amount, description },
  } = request;

  const statementOperation = {
    amount,
    description,
    type: 'credit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const {
    customer,
    body: { amount },
  } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount)
    return response.status(400).json({ error: 'Insufficient funds' });

  const statementOperation = {
    amount,
    type: 'debit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json({ clientStatement: customer.statement });
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const {
    customer,
    query: { date },
  } = request;

  const dateFormat = new Date(date);

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() === dateFormat.toDateString()
  );

  // by default when a request is success your status code is 200, then we don't need to inform it
  return response.json({ statement });
});

app.patch('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {
    customer,
    body: { name },
  } = request;

  customer.name = name;

  return response.send();
});

app.get('/customer/me', verifyIfExistsAccountCPF, (request, response) => {
  const {
    customer: { name, statement },
  } = request;

  return response.json({
    name,
    statement,
  });
});
