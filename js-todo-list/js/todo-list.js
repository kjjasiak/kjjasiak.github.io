class TodoList {
    constructor(selectorsIds = {}) {
        this.list = document.getElementById(selectorsIds.list) || document.getElementById('todo-list');
        this.addButton = document.getElementById(selectorsIds.addButton) || document.getElementById('todo-add');
        this.items = [];
        this.labels = [];
        this.loadList();
        this.loadLabels();
        this.attachListeners();
    }

    attachListeners() {
        this.addButton.addEventListener('click', () => {
            this.addItemNode();
        });

        document.addEventListener('focusin', (event) => {
            if (event.target && event.target.classList.contains('todo-text')) {
                event.target.parentNode.parentNode.querySelector('.mdc-chip-set').classList.add('hidden');

                const itemIndex = this.getItemIndex(event.target.parentNode.parentNode);
                if (itemIndex >= 0) {
                    event.target.value = this.items[itemIndex].name;
                }
            }
        });

        document.addEventListener('focusout', (event) => {
            if (event.target && event.target.classList.contains('todo-text')) {
                this.saveItem(event.target);
                event.target.parentNode.parentNode.querySelector('.mdc-chip-set').classList.remove('hidden');
            }
        });

        document.addEventListener('click', (event) => {
            if (event.target && event.target.classList.contains('todo-text')) {
                this.editItem(event.target);
            }

            if (event.target && event.target.classList.contains('todo-delete')) {
                this.removeItem(event.target.parentNode.parentNode);
            }

            if (event.target && event.target.classList.contains('todo-status')) {
                this.toggleItemStatus(event.target);
            }

            if (event.target && event.target.classList.contains('todo-label-remove')) {
                this.removeItemLabel(event.target.parentNode.parentNode);
            }

            if (event.target && event.target.classList.contains('todo-labels-list-item')) {
                event.preventDefault();

                const filterQuery = event.target.classList.contains('all-labels') ? 'all' : event.target.querySelector('.mdc-list-item__text').innerHTML;
                this.filterItems(filterQuery); 
            }
        });

        document.addEventListener('keydown', (event) => {
            const key = event.keyCode || event.charCode;

            switch(key) {
                case 8:
                case 46:
                    this.onItemBackspaceKey(event);
                    break;
                case 13:
                    this.onItemEnterKey(event);
                    break;
            }
        });
    }

    getItemIndex(itemNode) {
        return this.items.findIndex((item => item.id == itemNode.getAttribute('id')));
    }

    removeItemLabel(labelNode) {
        const itemNode = labelNode.parentNode.parentNode;
        const itemIndex = this.items.findIndex((item => item.id == itemNode.getAttribute('id')));
        const labelText = labelNode.querySelector('.mdc-chip__text').innerHTML;

        this.items[itemIndex].labels = this.items[itemIndex].labels.filter((label) => {
            return label !== labelText;
        });

        const regExp = new RegExp(' ?(#' + labelText +')', 'g');
        this.items[itemIndex].name = this.items[itemIndex].name.replace(regExp, '').trim();

        labelNode.remove();

        this.storeList();
    }

    filterItems(filterQuery) {
        const itemsNodes = Array.from(this.list.children);

        itemsNodes.map((node) => node.classList.remove('hidden'));

        if (filterQuery === 'all') {
            return;
        }

        itemsNodes.map((node) => {
            let itemIndex = this.items.findIndex((item => item.id == node.getAttribute('id')));

            if (this.items[itemIndex].labels.indexOf(filterQuery) === -1) {
                node.classList.add('hidden');
            }
        });
    }

    onItemBackspaceKey(event) {
        const itemNode = event.target.parentNode.parentNode;

        if (event.target && event.target.classList.contains('todo-text')) {
            if (event.target.value.length - 1 < 0 && itemNode.previousSibling) {
                event.preventDefault();
                itemNode.previousSibling.querySelector('.todo-text').focus();
            }
        }
    }

    onItemEnterKey(event) {
        if (event.target && event.target.classList.contains('todo-text')) {
            event.target.blur();
            this.addItemNode();
        }
    }

    toggleItemStatus(checkbox) {
        const itemNode = checkbox.parentNode.parentNode.parentNode;
        const itemIndex = this.items.findIndex((item => item.id == itemNode.getAttribute('id')));

        if (itemNode.classList.contains('todo-done')) {
            itemNode.classList.remove('todo-done');
            checkbox.setAttribute('checked', false);

            this.items[itemIndex].done = false;
        }
        else {
            itemNode.classList.add('todo-done');
            checkbox.setAttribute('checked', true);

            this.items[itemIndex].done = true;
        }

        this.storeList();
    }

    removeItem(itemNode) {
        this.items = this.items.filter((item) => {
            return item.id !== itemNode.getAttribute('id');
        });

        this.storeList();
        itemNode.remove();

        this.toggleNoItemsMsg();
    }

    editItem(input) {
        // this.toggleFocus(input, true);
    }

    addItemNode() {
        const node = TodoItem.buildNode();
        this.list.append(node);

        this.toggleNoItemsMsg();

        node.classList.add('editable');
        node.querySelector('.todo-text').focus();
    }

    saveItem(input) {
        const itemNode = input.parentNode.parentNode;

        if (input.value.length < 3) {
            itemNode.remove();
            this.removeItem(itemNode);

            this.toggleNoItemsMsg();

            return;
        }

        const itemIndex = this.items.findIndex((item => item.id == itemNode.getAttribute('id')));

        const labelRegExp = /(#\S+)/g;
        let labels = input.value.match(labelRegExp) || [];
        
        labels = labels.map((label) => {
            return label.substring(1);
        });

        // const itemName = input.value.replace(labelRegExp, '').trim();
        const itemName = this.stripLabels(input.value);

        if (itemIndex >= 0) {
            this.items[itemIndex].name = input.value;

            this.items[itemIndex].labels = labels;
            itemNode.querySelector('.mdc-chip-set').innerHTML = "";

            for (let label of labels) {
                // if (this.items[itemIndex].labels.indexOf(label) === -1) {
                    // this.items[itemIndex].labels.push(label);
                    this.constructLabel(label, itemNode);
                // }
            }
        }
        else {
            this.items.push(new TodoItem(itemNode.getAttribute('id'), input.value, null, labels));

            for (let label of labels) {
                this.constructLabel(label, itemNode);
            }
        }

        input.value = itemName;

        this.storeList();
    }

    stripLabels(taskString) {
        const labelRegExp = /\s?(#\S+)/g;
        return taskString.replace(labelRegExp, '').trim();
    }

    loadList() {
        this.items = JSON.parse(localStorage.getItem('todoList')) || [];
        this.constructNodes();
    }

    storeList() {
        localStorage.setItem('todoList', JSON.stringify(this.items));
    }

    loadLabels() {
        this.labels = JSON.parse(localStorage.getItem('todo-list-labels')) || [];
        this.constructLabelsList();
    }

    storeLabels() {
        localStorage.setItem('todo-list-labels', JSON.stringify(this.labels));
    }

    toggleNoItemsMsg() {
        if (this.list.querySelectorAll('li').length === 0) {
            document.getElementById('todo-list-empty').innerHTML = 'No items to show';
        }
        else {
            document.getElementById('todo-list-empty').innerHTML = '';
        }
    }

    constructLabel(labelText, itemNode) {
        const chipSetEl = itemNode.querySelector('.mdc-chip-set');
        const chipSet = new mdc.chips.MDCChipSet(chipSetEl);
        
        const chipEl = document.createElement('div');

        chipEl.classList.add('mdc-chip', 'todo-label-chip');
        chipEl.setAttribute('role', 'row');
        
        const chipHtml = `<div class="mdc-chip__ripple"></div>
        <span role="gridcell">
          <span role="button" tabindex="0" class="mdc-chip__primary-action">
            <span class="mdc-chip__text">${labelText}</span>
          </span>
        </span>
        <span role="gridcell">
          <i class="material-icons mdc-chip__icon mdc-chip__icon--trailing todo-label-remove" tabindex="-1" role="button">cancel</i>
        </span>`;

        chipEl.innerHTML = chipHtml;
        chipSetEl.appendChild(chipEl);
        chipSet.addChip(chipEl);

        if (this.labels.indexOf(labelText) === -1) {
            this.labels.push(labelText);
            this.storeLabels();
        }
    }

    constructLabelsList() {
        const labelsListNode = document.querySelector('.todo-labels-list');

        for (let label of this.labels) {
            const labelEl = document.createElement('a');
            labelEl.classList.add('mdc-list-item', 'todo-labels-list-item');
            labelEl.setAttribute('href', '#');

            labelEl.innerHTML = `<span class="mdc-list-item__ripple"></span>
                  <i class="material-icons mdc-list-item__graphic" aria-hidden="true">label</i>
                  <span class="mdc-list-item__text">${label}</span>`;
            labelsListNode.append(labelEl);
        }
    }

    constructNodes() {
        for (let item of this.items) {
            let node = TodoItem.buildNode();
            node = TodoItem.setNodeData(node, this.stripLabels(item.name));
            node.setAttribute('id', item.id);

            if (item.done) {
                node.classList.add('todo-done');
                node.querySelector('input[type="checkbox"]').setAttribute('checked', true);
            }

            for (let label of item.labels) {
                this.constructLabel(label, node);
            }

            this.list.append(node);
        }

        this.toggleNoItemsMsg();
    }
}

class TodoItem {
    constructor(id, name, date, labels) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.labels = labels;
        this.done = false;
    }

    static generateUid() {
        return Math.random().toString(36).slice(-6) + '-' + Math.random().toString(36).slice(-6);
    }

    static buildNode() {
        const node = document.createElement('li');

        node.classList.add('mdc-list-item');
        node.setAttribute('id', TodoItem.generateUid());
        node.setAttribute('role', 'checkbox');
        node.innerHTML = TodoItem.getNodeTemplate().trim();

        return node;
    }

    static setNodeData(node, name, date = null, labels = []) {
        const input = node.querySelector('.todo-text');
        input.value = name;

        return node;
    }

    static getNodeTemplate() {
        return `<span class="mdc-list-item__ripple"></span>
    <span class="mdc-list-item__graphic">
      <div class="mdc-checkbox">
        <input type="checkbox"
                class="mdc-checkbox__native-control todo-status" />
        <div class="mdc-checkbox__background">
          <svg class="mdc-checkbox__checkmark"
                viewBox="0 0 24 24">
            <path class="mdc-checkbox__checkmark-path"
                  fill="none"
                  d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
          </svg>
          <div class="mdc-checkbox__mixedmark"></div>
        </div>
      </div>
    </span>
    <div class="mdc-text-field text-field mdc-text-field--fullwidth mdc-text-field--no-label mdc-ripple-upgraded todo-input"
                style="--mdc-ripple-fg-size:720px; --mdc-ripple-fg-scale:1.68237; --mdc-ripple-fg-translate-start:-290.5px, -316px; --mdc-ripple-fg-translate-end:240px, -332px;">
                <input type="text" placeholder="Write your todo here (min. 3 characters)" class="mdc-text-field__input todo-text"
                    aria-label="">
            </div>
            <div class="mdc-chip-set mdc-chip-set--input" role="grid"></div>
    <span class="mdc-list-item__meta">
      <button class="mdc-icon-button material-icons todo-delete">delete</button>
    </span>
  `;
    }
}