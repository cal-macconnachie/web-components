
export const register = ({
  name,
  element,
}: {
  name: string
  element: CustomElementConstructor
}) => {
  if (!customElements.get(name)) {
    customElements.define(name, element);
  }
}
