import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TabCalculadora from './TabCalculadora'

const usuario = { score_crediticio: 720 }

describe('<TabCalculadora />', () => {
  it('renderiza el título y el costo total inicial', () => {
    render(<TabCalculadora usuario={usuario} />)
    expect(screen.getByText('Calculadora de Carrito')).toBeInTheDocument()
    // monto 513, 4 quincenas → 513 * 1.12 = 574.56
    expect(screen.getAllByText('$574.56 MXN').length).toBeGreaterThan(0)
  })

  it('solo ofrece los plazos permitidos por el score (720 → 2,4,6,8)', () => {
    render(<TabCalculadora usuario={usuario} />)
    // Los números de quincena visibles en el selector
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.queryByText('10')).not.toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  it('recalcula el total cuando cambia el monto', async () => {
    const user = userEvent.setup()
    render(<TabCalculadora usuario={usuario} />)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '1000')

    // 1000 * (1 + 0.03*4) = 1120
    expect(screen.getAllByText('$1,120.00 MXN').length).toBeGreaterThan(0)
  })
})
