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
            const { target } = event;

            if (target && this.hasClass(target, 'todo-text')) {
                // target.parentNode.parentNode.querySelector('.mdc-chip-set').classList.add('hidden');
                this.getParentByClass(target, 'mdc-list-item').querySelector('.mdc-chip-set').classList.add('hidden');

                const itemIndex = this.getItemIndex(this.getParentByClass(target, 'mdc-list-item'));
                if (itemIndex >= 0) {
                    target.value = this.items[itemIndex].name;
                }
            }

            if (target && this.hasClass(target, 'todo-date')) {

            }
        });

        document.addEventListener('focusout', (event) => {
            const { target } = event;

            if (target && this.hasClass(target, 'todo-text')) {
                this.saveItem(target);
                // target.parentNode.parentNode.querySelector('.mdc-chip-set').classList.remove('hidden');
                this.getParentByClass(target, 'mdc-list-item').querySelector('.mdc-chip-set').classList.remove('hidden');
            }

            if (target && this.hasClass(target, 'todo-date')) {
                this.saveItem(this.getParentByClass(target, 'mdc-list-item').querySelector('.todo-text'));
            }
        });

        document.addEventListener('click', (event) => {
            const events = {
                'todo-text': (event) => this.editItem(event.target),
                'todo-delete': (event) => this.removeItem(this.getParentByClass(event.target, 'mdc-list-item')),
                'todo-status': (event) => this.toggleItemStatus(event.target),
                'todo-label-remove': (event) => this.removeItemLabel(this.getParentByClass(event.target, 'todo-label-chip')),
                'todo-labels-list-item': (event) => {
                    const target = event.target;
                    event.preventDefault();
    
                    const filterQuery = this.hasClass(target, 'all-labels') ? 'all' : target.querySelector('.mdc-list-item__text').innerHTML;
                    this.filterItems(filterQuery); 
                }
            };

            const selectors = Object.keys(events);
            selectors.forEach((className) => {
                if (event.target && this.hasClass(event.target, className)) {
                    events[className](event);
                }
            });
        });

        // document.addEventListener('click', (event) => {
        //     if (target && this.hasClass(target, 'todo-text')) {
        //         this.editItem(target);
        //     }

        //     if (target && this.hasClass(target, 'todo-delete')) {
        //         this.removeItem(target.parentNode.parentNode);
        //     }

        //     if (target && this.hasClass(target, 'todo-status')) {
        //         this.toggleItemStatus(target);
        //     }

        //     if (target && this.hasClass(target, 'todo-label-remove')) {
        //     // if (event.target && event.target.classList.contains('todo-label-remove')) {
        //         this.removeItemLabel(target.parentNode.parentNode);
        //     }

        //     if (target && this.hasClass(target, 'todo-labels-list-item')) {
        //     // if (event.target && event.target.classList.contains('todo-labels-list-item')) {
        //         event.preventDefault();

        //         const filterQuery = this.hasClass(target, 'all-labels') ? 'all' : target.querySelector('.mdc-list-item__text').innerHTML;
        //         // const filterQuery = target.classList.contains('all-labels') ? 'all' : target.querySelector('.mdc-list-item__text').innerHTML;
        //         this.filterItems(filterQuery); 
        //     }
        // });

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

    removeItemLabel(labelNode) {
        const itemNode = this.getParentByClass(labelNode, 'mdc-list-item'),
              itemIndex = this.getItemIndex(itemNode),
              labelText = labelNode.querySelector('.mdc-chip__text').innerHTML;

        this.items[itemIndex].labels = this.items[itemIndex].labels.filter((label) => {
            return label !== labelText;
        });

        const regExp = new RegExp(' ?(#' + labelText +')', 'g');
        this.items[itemIndex].name = this.items[itemIndex].name.replace(regExp, '').trim();

        labelNode.remove();

        this.storeList();

        this.labels = this.labels.filter((label) => {
            return label !== labelText;
        });

        this.constructLabelsList();
    }

    filterItems(filterQuery) {
        const itemsNodes = Array.from(this.list.children);

        itemsNodes.map((node) => this.removeClass(node, 'hidden'));
        // itemsNodes.map((node) => node.classList.remove('hidden'));

        if (filterQuery === 'all') {
            return;
        }

        itemsNodes.map((node) => {
            // let itemIndex = this.items.findIndex((item => item.id == node.getAttribute('id')));
            let itemIndex = this.getItemIndex(node);

            // if (this.items[itemIndex].labels.indexOf(filterQuery) === -1) {
            if (!this.hasElement(filterQuery, this.items[itemIndex].labels)) {
                this.addClass(node, 'hidden');
            }
        });
    }

    onItemBackspaceKey(event) {
        const itemNode = this.getParentByClass(event.target, 'mdc-list-item');
        // const itemNode = event.target.parentNode.parentNode;

        if (event.target && this.hasClass(event.target, 'todo-text')) {
            if (event.target.value.length - 1 < 0 && itemNode.previousSibling) {
                event.preventDefault();

                itemNode.previousSibling.querySelector('.todo-text').focus();
            }
        }
    }

    onItemEnterKey(event) {
        // if (event.target && event.target.classList.contains('todo-text')) {
        if (event.target && this.hasClass(event.target, 'todo-text')) {
            event.target.blur();
            this.addItemNode();
        }
    }

    toggleItemStatus(checkbox) {
        // const itemNode = checkbox.parentNode.parentNode.parentNode;
        const itemNode = this.getParentByClass(checkbox, 'mdc-list-item');
        // const itemIndex = this.items.findIndex((item => item.id == itemNode.getAttribute('id')));
        const itemIndex = this.getItemIndex(itemNode);

        if (this.hasClass(itemNode, 'todo-done')) {
        // if (itemNode.classList.contains('todo-done')) {
            this.removeClass(itemNode, 'todo-done');
            // itemNode.classList.remove('todo-done');
            checkbox.setAttribute('checked', false);

            this.items[itemIndex].done = false;
        }
        else {
            this.addClass(itemNode, 'todo-done');
            // itemNode.classList.add('todo-done');
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
        //console.log(this.items);
    }

    addItemNode() {
        const node = TodoItem.buildNode();
        this.list.append(node);

        this.toggleNoItemsMsg();

        this.addClass(node, 'editable');
        // node.classList.add('editable');
        node.querySelector('.todo-text').focus();
    }

    saveItem(input) {
        // const itemNode = input.parentNode.parentNode;
        const itemNode = this.getParentByClass(input, 'mdc-list-item');
        const dateInput = itemNode.querySelector('input[type="date"]');

        if (input.value.length < 3) {
            itemNode.remove();
            this.removeItem(itemNode);

            this.toggleNoItemsMsg();

            return;
        }

        const itemIndex = this.getItemIndex(itemNode);

        const labelRegExp = /(#\S+)/g;
        let labels = input.value.match(labelRegExp) || [];
        
        labels = labels.map((label) => {
            return label.substring(1);
        });

        const itemName = this.stripLabels(input.value);
        console.log(dateInput.value);

        if (itemIndex >= 0) {
            this.items[itemIndex].name = input.value;
            this.items[itemIndex].labels = labels;
            this.items[itemIndex].date = dateInput.value;
            itemNode.querySelector('.mdc-chip-set').innerHTML = "";

            for (let label of labels) {
                this.constructLabel(label, itemNode);
            }
        }
        else {
            console.log(dateInput.value);
            this.items.push(new TodoItem(itemNode.getAttribute('id'), input.value, dateInput.value, labels));

            for (let label of labels) {
                this.constructLabel(label, itemNode);
            }
        }

        input.value = itemName;

        const dateObj = new Date(dateInput.value),
              currDate = new Date().setHours(0, 0, 0, 0);

        if (dateInput !== "" && dateInput !== null && dateObj < currDate) {
            itemNode.classList.add('overdue');
        }
        else {
            itemNode.classList.remove('overdue');
        }

        this.storeList();

        this.constructLabelsList();
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

        // chipEl.classList.add('mdc-chip', 'todo-label-chip');
        this.addClass(chipEl, 'mdc-chip', 'todo-label-chip');
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

        // if (this.labels.indexOf(labelText) === -1) {
        if (!this.hasElement(labelText, this.labels)) {
            this.labels.push(labelText);
            this.storeLabels();
        }
    }

    hasElement(el, arr) {
        return (arr.indexOf(el) === -1) ? false : true;
    }

    constructLabelsList() {
        const labelsListNode = document.querySelector('.todo-labels-list');

        labelsListNode.innerHTML = `<a class="mdc-list-item todo-labels-list-item all-labels mdc-list-item--activated" href="#" aria-current="label">
        <span class="mdc-list-item__ripple"></span>
        <i class="material-icons mdc-list-item__graphic" aria-hidden="true">inbox</i>
        <span class="mdc-list-item__text">All items</span>
      </a>`;

        for (let label of this.labels) {
            const labelEl = document.createElement('a');
            this.addClass(labelEl, 'mdc-list-item', 'todo-labels-list-item');
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
            node = TodoItem.setNodeData(node, this.stripLabels(item.name), item.date);
            node.setAttribute('id', item.id);

            if (item.done) {
                this.addClass(node, 'todo-done');
                // node.classList.add('todo-done');
                node.querySelector('input[type="checkbox"]').setAttribute('checked', true);
            }

            for (let label of item.labels) {
                this.constructLabel(label, node);
            }

            this.list.append(node);
        }

        this.toggleNoItemsMsg();
    }

    addClass(target, ...className) {
        target.classList.add(...className);
    }

    removeClass(target, ...className) {
        target.classList.remove(...className);
    }

    hasClass(target, className) {
        return target.classList.contains(className);
    }

    getParentByClass(target, className) {
        let currentEl = target;
        let parent = null;

        while (parent !== document) {
            parent = currentEl.parentNode;

            if (parent.classList.contains(className)) {
                break;
            }
            currentEl = parent;
        }

        return parent;
    }

    getParent(node, levels) {
        let currentNode = node;

        for (let i = 0; i < levels; i++) {
            currentNode = currentNode.parentNode;
        }

        return currentNode;
    }

    getItemIndex(itemNode) {
        return this.items.findIndex((item => item.id == itemNode.getAttribute('id')));
    }

    stripLabels(taskString) {
        const labelRegExp = /\s?(#\S+)/g;
        return taskString.replace(labelRegExp, '').trim();
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

    static setNodeData(node, name, date = "", labels = []) {
        const nameInput = node.querySelector('.todo-text');
        nameInput.value = name;

        if (date !== "") {
            const dateInput = node.querySelector('input[type="date"]');
            // let dateString = `${date.getUTCFullYear()}-${date.getUTCMonth()+1}-`;
            // dateString += (date.getUTCDate() < 10) ? '0' + date.getUTCDate() : date.getUTCDate();

            // dateInput.value = dateString;
            dateInput.value = date;

            const dateObj = new Date(date),
                  currDate = new Date().setHours(0, 0, 0, 0);

            if (date !== "" && date !== null && dateObj < currDate) {
                node.classList.add('overdue');
            }
        }
        

        return node;
    }

    static getNodeTemplate() {
        // const date = new Date();
        // let dateString = `${date.getUTCFullYear()}-${date.getUTCMonth()+1}-`;

        // dateString += (date.getUTCDate() < 10) ? '0' + date.getUTCDate() : date.getUTCDate();

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
            <input type="date" class="todo-date" name="todo-date" value="">
    <span class="mdc-list-item__meta">
      <button class="mdc-icon-button material-icons todo-delete">delete</button>
    </span>
  `;
    }
}