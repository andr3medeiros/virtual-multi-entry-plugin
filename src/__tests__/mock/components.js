// Mock React-like components for testing
export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    throw new Error('render() method must be implemented');
  }
}

export class Button extends Component {
  render() {
    const { children, onClick, className = '', disabled = false } = this.props;
    return `
      <button 
        class="button ${className}" 
        ${disabled ? 'disabled' : ''}
        ${onClick ? `onclick="${onClick}"` : ''}
      >
        ${children || ''}
      </button>
    `;
  }
}

export class Card extends Component {
  render() {
    const { children, title, className = '' } = this.props;
    return `
      <div class="card ${className}">
        ${title ? `<h3>${title}</h3>` : ''}
        <div class="card-content">
          ${children || ''}
        </div>
      </div>
    `;
  }
}

export class Modal extends Component {
  render() {
    const { children, isOpen, onClose, title } = this.props;
    
    if (!isOpen) return '';
    
    return `
      <div class="modal-overlay" onclick="${onClose}">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            ${title ? `<h2>${title}</h2>` : ''}
            <button class="modal-close" onclick="${onClose}">&times;</button>
          </div>
          <div class="modal-content">
            ${children || ''}
          </div>
        </div>
      </div>
    `;
  }
}

export class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: props.initialValues || {},
      errors: {},
    };
  }

  handleChange = (field, value) => {
    this.setState({
      values: { ...this.state.values, [field]: value },
      errors: { ...this.state.errors, [field]: null },
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { onSubmit } = this.props;
    if (onSubmit) {
      onSubmit(this.state.values);
    }
  };

  render() {
    const { children, className = '' } = this.props;
    return `
      <form class="form ${className}" onsubmit="${this.handleSubmit}">
        ${children || ''}
      </form>
    `;
  }
}

export class Input extends Component {
  render() {
    const { 
      name, 
      type = 'text', 
      value, 
      placeholder, 
      onChange, 
      className = '',
      required = false 
    } = this.props;
    
    return `
      <input 
        type="${type}"
        name="${name}"
        value="${value || ''}"
        placeholder="${placeholder || ''}"
        class="input ${className}"
        ${required ? 'required' : ''}
        ${onChange ? `onchange="${onChange}"` : ''}
      />
    `;
  }
}
