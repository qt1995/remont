/**
 * Строка из админки с простым оформлением: жирная, курсивом или обычная.
 * Полноценный редактор здесь избыточен — в списках нужны ровно эти три состояния.
 */
export function RichText({ text, emphasis }: { text: string; emphasis?: string }) {
  const bold = emphasis?.includes('bold')
  const italic = emphasis?.includes('italic')

  return (
    <span className={(bold ? 'font-semibold ' : '') + (italic ? 'italic' : '')}>{text}</span>
  )
}
