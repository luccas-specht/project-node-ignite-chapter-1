
const express = require('express')
const { v4: uuidV4 } = require('uuid')

const app = express()

app.use(express.json())
app.listen(3333)

/**
 * cpf - string
 * name - string
 * id - uuid (universally unique identifier)
 * statement []
 */

const customers = []


app.post('/account', (request, response) => {
    const { name, cpf } = request.body

    const customerAlreadyExists = customers.some((customer)=> customer.cpf === cpf)

    if(customerAlreadyExists)  
        return response.status(400).json({
            message: "customer already exists"
        })
    

    customers.push({
        id: uuidV4(),
        cpf, 
        name,
        statement: []
    })

    return response.status(201).send()
})

app.get('/statement', (request, response) => {
    const headers = request.headers

    const customer = customers.find((customer) => customer.cpf === headers.cpf)  

    if(!customer) 
      return response.status(400).json({ message: "customer not found"})

    return response.status(200).json({
        clientStatement: customer.statement
    })
})

