import type { Meta, StoryObj } from '@storybook/react-vite'
import { BudgetForm, CardForm, ExpenseForm, GoalForm, SaveForm } from '../forms'
import { initialData } from '../finance'

const seed = initialData()

const meta: Meta = {
  title: 'Components/Forms',
  tags: ['autodocs'],
}

export default meta

export const NewExpense: StoryObj = {
  name: 'ExpenseForm (Novo Gasto)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <ExpenseForm cards={seed.cards} onSave={(tx) => alert(`Gasto salvo: ${tx.name} — R$ ${tx.amount}`)} />
    </div>
  ),
}

export const EditExpense: StoryObj = {
  name: 'ExpenseForm (Editar Gasto)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <ExpenseForm
        transaction={seed.transactions[0]}
        cards={seed.cards}
        onSave={(tx) => alert(`Gasto atualizado: ${tx.name}`)}
      />
    </div>
  ),
}

export const NewCard: StoryObj = {
  name: 'CardForm (Cartão)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <CardForm card={seed.cards[0]} onSave={(card) => alert(`Cartão salvo: ${card.name}`)} />
    </div>
  ),
}

export const NewGoal: StoryObj = {
  name: 'GoalForm (Nova Meta)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <GoalForm onSave={(goal) => alert(`Meta criada: ${goal.name}`)} />
    </div>
  ),
}

export const SaveToGoal: StoryObj = {
  name: 'SaveForm (Guardar na Meta)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <SaveForm
        goal={seed.goals[0]}
        balance={14500}
        onSave={(amount) => alert(`Guardado: R$ ${amount}`)}
      />
    </div>
  ),
}

export const EditBudget: StoryObj = {
  name: 'BudgetForm (Ajustar Teto)',
  render: () => (
    <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
      <BudgetForm
        name="Alimentação"
        value={seed.limits['Alimentação']}
        onSave={(value) => alert(`Novo teto: R$ ${value}`)}
      />
    </div>
  ),
}
