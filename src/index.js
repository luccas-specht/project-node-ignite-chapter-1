const express = require('express');
const { v4: uuidV4 } = require('uuid');

const app = express();

app.use(express.json());
app.listen(3333);

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
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
  const { name, cpf } = request.body;
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
  const { customer } = request;
  const { amount, description } = request.body;

  const statementOperation = {
    amount,
    description,
    type: 'credit',
    create_at: new Date(),
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance = getBalance(customer.statement);

  if (balance < amount)
    return response.status(400).json({ error: 'Insufficient funds' });

  const statementOperation = {
    amount,
    type: 'debit',
    create_at: new Date(),
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(200).json({ clientStatement: customer.statement });
});
