import type { EmployeeSynthesisPayload } from '#services/employee_synthesis_service'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { SynthesisPdfDocument } from './employee_synthesis_pdf/index.js'

export class EmployeeSynthesisPdfService {
  public async generateShareablePdf(input: {
    payload: Omit<EmployeeSynthesisPayload, 'synthesis'> & {
      synthesis: Omit<EmployeeSynthesisPayload['synthesis'], 'expertNotesInternal'>
    }
  }): Promise<Uint8Array> {
    const buffer = await renderToBuffer(
      React.createElement(SynthesisPdfDocument, input.payload) as React.ReactElement<any>
    )
    return new Uint8Array(buffer)
  }
}
