
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const myData = writable([]);

    const selectedOption = writable();

    const collPick = writable(0);

    const selectedIndex = writable(0);

    const API_URI = writable('https://aware-crow-shrug.cyclic.app'); 

    //export const API_URI = writable('http://localhost:3000')

    /* src\GetData.svelte generated by Svelte v3.59.2 */

    function create_fragment$b(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $myData;
    	let $collPick;
    	let $API_URI;
    	let $selectedOption;
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(0, $myData = $$value));
    	validate_store(collPick, 'collPick');
    	component_subscribe($$self, collPick, $$value => $$invalidate(1, $collPick = $$value));
    	validate_store(API_URI, 'API_URI');
    	component_subscribe($$self, API_URI, $$value => $$invalidate(2, $API_URI = $$value));
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(3, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GetData', slots, []);

    	set_store_value(
    		selectedOption,
    		$selectedOption = {
    			col_a: "",
    			col_b: "",
    			col_c: "",
    			col_d: "",
    			col_e: "",
    			col_f: "",
    			col_g: "",
    			col_h: ""
    		},
    		$selectedOption
    	);

    	const refreshMe = async () => {
    		const res = await fetch($API_URI + '/old/' + $collPick);
    		set_store_value(myData, $myData = await res.json(), $myData);
    	}; //console.log ($myData)

    	onMount(refreshMe);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GetData> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		myData,
    		collPick,
    		API_URI,
    		selectedOption,
    		onMount,
    		refreshMe,
    		$myData,
    		$collPick,
    		$API_URI,
    		$selectedOption
    	});

    	return [];
    }

    class GetData extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GetData",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\SelectTitle3.svelte generated by Svelte v3.59.2 */
    const file$9 = "src\\SelectTitle3.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (34:21) {#if option.col_a === ""}
    function create_if_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(" ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(34:21) {#if option.col_a === \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#each $myData as option, index}
    function create_each_block$1(ctx) {
    	let button;
    	let t0_value = /*option*/ ctx[8].col_a + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block = /*option*/ ctx[8].col_a === "" && create_if_block$3(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*option*/ ctx[8], /*index*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(button, "class", "svelte-a4o1x1");
    			toggle_class(button, "selected", /*$selectedIndex*/ ctx[1] === /*index*/ ctx[10]);
    			add_location(button, file$9, 25, 6, 789);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler, false, false, false, false),
    					listen_dev(button, "focus", /*focus_handler*/ ctx[6], false, false, false, false),
    					listen_dev(button, "blur", /*blur_handler*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$myData*/ 4 && t0_value !== (t0_value = /*option*/ ctx[8].col_a + "")) set_data_dev(t0, t0_value);

    			if (/*option*/ ctx[8].col_a === "") {
    				if (if_block) ; else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(button, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$selectedIndex*/ 2) {
    				toggle_class(button, "selected", /*$selectedIndex*/ ctx[1] === /*index*/ ctx[10]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(25:4) {#each $myData as option, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let each_value = /*$myData*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "container svelte-a4o1x1");
    			add_location(div, file$9, 23, 2, 718);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeyDown*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedIndex, $selectedOption, $myData, focused*/ 15) {
    				each_value = /*$myData*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $selectedIndex;
    	let $myData;
    	let $selectedOption;
    	validate_store(selectedIndex, 'selectedIndex');
    	component_subscribe($$self, selectedIndex, $$value => $$invalidate(1, $selectedIndex = $$value));
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(2, $myData = $$value));
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(3, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelectTitle3', slots, []);
    	let focused = false;

    	const handleKeyDown = event => {
    		if (!focused) return;
    		const currentIndex = $selectedIndex;
    		const maxIndex = $myData.length - 1;

    		if (event.key === 'ArrowUp') {
    			set_store_value(selectedIndex, $selectedIndex = currentIndex === 0 ? maxIndex : currentIndex - 1, $selectedIndex);
    			set_store_value(selectedOption, $selectedOption = $myData[$selectedIndex], $selectedOption);
    		} else if (event.key === 'ArrowDown') {
    			set_store_value(selectedIndex, $selectedIndex = currentIndex === maxIndex ? 0 : currentIndex + 1, $selectedIndex);
    			set_store_value(selectedOption, $selectedOption = $myData[$selectedIndex], $selectedOption);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelectTitle3> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (option, index) => {
    		set_store_value(selectedOption, $selectedOption = option, $selectedOption);
    		set_store_value(selectedIndex, $selectedIndex = index, $selectedIndex);
    	};

    	const focus_handler = () => $$invalidate(0, focused = true);
    	const blur_handler = () => $$invalidate(0, focused = false);

    	$$self.$capture_state = () => ({
    		myData,
    		selectedOption,
    		selectedIndex,
    		focused,
    		handleKeyDown,
    		$selectedIndex,
    		$myData,
    		$selectedOption
    	});

    	$$self.$inject_state = $$props => {
    		if ('focused' in $$props) $$invalidate(0, focused = $$props.focused);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		focused,
    		$selectedIndex,
    		$myData,
    		$selectedOption,
    		handleKeyDown,
    		click_handler,
    		focus_handler,
    		blur_handler
    	];
    }

    class SelectTitle3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTitle3",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\ViewTitle.svelte generated by Svelte v3.59.2 */
    const file$8 = "src\\ViewTitle.svelte";

    // (5:2) {#if $selectedOption}
    function create_if_block$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "id", "title1");
    			attr_dev(input, "class", "svelte-vgyalv");
    			add_location(input, file$8, 5, 2, 110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$selectedOption*/ ctx[0].col_a);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selectedOption*/ 1 && input.value !== /*$selectedOption*/ ctx[0].col_a) {
    				set_input_value(input, /*$selectedOption*/ ctx[0].col_a);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(5:2) {#if $selectedOption}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*$selectedOption*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedOption*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $selectedOption;
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(0, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ViewTitle', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ViewTitle> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		$selectedOption.col_a = this.value;
    		selectedOption.set($selectedOption);
    	}

    	$$self.$capture_state = () => ({ selectedOption, $selectedOption });
    	return [$selectedOption, input_input_handler];
    }

    class ViewTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ViewTitle",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\ViewDoc.svelte generated by Svelte v3.59.2 */
    const file$7 = "src\\ViewDoc.svelte";

    function create_fragment$8(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "id", "body1");
    			attr_dev(textarea, "class", "svelte-5xxgif");
    			add_location(textarea, file$7, 17, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*$selectedOption*/ ctx[0].col_c);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedOption*/ 1) {
    				set_input_value(textarea, /*$selectedOption*/ ctx[0].col_c);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $selectedOption;
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(0, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ViewDoc', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ViewDoc> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		$selectedOption.col_c = this.value;
    		selectedOption.set($selectedOption);
    	}

    	$$self.$capture_state = () => ({ selectedOption, $selectedOption });
    	return [$selectedOption, textarea_input_handler];
    }

    class ViewDoc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ViewDoc",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\DeleteBtn.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\DeleteBtn.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "deleteMe";
    			add_location(button, file$6, 16, 0, 368);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*deleteMe*/ ctx[0], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $myData;
    	let $collPick;
    	let $API_URI;
    	let $selectedOption;
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(1, $myData = $$value));
    	validate_store(collPick, 'collPick');
    	component_subscribe($$self, collPick, $$value => $$invalidate(2, $collPick = $$value));
    	validate_store(API_URI, 'API_URI');
    	component_subscribe($$self, API_URI, $$value => $$invalidate(3, $API_URI = $$value));
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(4, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DeleteBtn', slots, []);

    	async function deleteMe() {
    		await fetch($API_URI + '/old/' + $selectedOption._id, { method: 'DELETE' });
    		const res = await fetch($API_URI + '/old/' + $collPick);
    		set_store_value(myData, $myData = await res.json(), $myData);
    	} //$selectedOption -= 1;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DeleteBtn> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		myData,
    		selectedOption,
    		collPick,
    		API_URI,
    		deleteMe,
    		$myData,
    		$collPick,
    		$API_URI,
    		$selectedOption
    	});

    	return [deleteMe];
    }

    class DeleteBtn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DeleteBtn",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\SaveBtn.svelte generated by Svelte v3.59.2 */
    const file$5 = "src\\SaveBtn.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "save";
    			add_location(button, file$5, 32, 0, 837);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*saveMe*/ ctx[0], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $myData;
    	let $collPick;
    	let $API_URI;
    	let $selectedOption;
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(1, $myData = $$value));
    	validate_store(collPick, 'collPick');
    	component_subscribe($$self, collPick, $$value => $$invalidate(2, $collPick = $$value));
    	validate_store(API_URI, 'API_URI');
    	component_subscribe($$self, API_URI, $$value => $$invalidate(3, $API_URI = $$value));
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(4, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SaveBtn', slots, []);

    	async function saveMe() {
    		await fetch($API_URI + '/old', {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify({
    				col_a: $selectedOption.col_a,
    				col_b: $selectedOption.col_b,
    				col_c: $selectedOption.col_c,
    				col_d: $selectedOption.col_d,
    				col_e: $selectedOption.col_e,
    				col_f: $selectedOption.col_f,
    				col_g: $selectedOption.col_g,
    				col_h: $selectedOption.col_h
    			})
    		}); //mode: 'no-cors' // Add this line
    		//credentials: 'include' // Add this line

    		const res = await fetch($API_URI + '/old/' + $collPick);
    		set_store_value(myData, $myData = await res.json(), $myData);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SaveBtn> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		myData,
    		selectedOption,
    		API_URI,
    		collPick,
    		saveMe,
    		$myData,
    		$collPick,
    		$API_URI,
    		$selectedOption
    	});

    	return [saveMe];
    }

    class SaveBtn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SaveBtn",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\NavData.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;

    const file$4 = "src\\NavData.svelte";

    function create_fragment$5(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let t9;
    	let button5;
    	let t11;
    	let button6;
    	let t13;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "1";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "2";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "3";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "4";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "5";
    			t9 = space();
    			button5 = element("button");
    			button5.textContent = "6";
    			t11 = text("\r\n  ");
    			button6 = element("button");
    			button6.textContent = "A-Z";
    			t13 = text("\r\n ");
    			input = element("input");
    			attr_dev(button0, "class", "svelte-dne3gz");
    			toggle_class(button0, "selected", /*$collPick*/ ctx[1] === 0);
    			add_location(button0, file$4, 46, 0, 1659);
    			attr_dev(button1, "class", "svelte-dne3gz");
    			toggle_class(button1, "selected", /*$collPick*/ ctx[1] === 1);
    			add_location(button1, file$4, 47, 0, 1757);
    			attr_dev(button2, "class", "svelte-dne3gz");
    			toggle_class(button2, "selected", /*$collPick*/ ctx[1] === 2);
    			add_location(button2, file$4, 48, 0, 1855);
    			attr_dev(button3, "class", "svelte-dne3gz");
    			toggle_class(button3, "selected", /*$collPick*/ ctx[1] === 3);
    			add_location(button3, file$4, 49, 0, 1953);
    			attr_dev(button4, "class", "svelte-dne3gz");
    			toggle_class(button4, "selected", /*$collPick*/ ctx[1] === 4);
    			add_location(button4, file$4, 50, 0, 2051);
    			attr_dev(button5, "class", "svelte-dne3gz");
    			toggle_class(button5, "selected", /*$collPick*/ ctx[1] === 5);
    			add_location(button5, file$4, 51, 0, 2149);
    			add_location(button6, file$4, 52, 6, 2253);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-dne3gz");
    			add_location(input, file$4, 53, 5, 2300);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button4, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button5, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button6, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*mySearch*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[8], false, false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[9], false, false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[10], false, false, false, false),
    					listen_dev(button6, "click", /*sortMe*/ ctx[3], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[11]),
    					listen_dev(input, "change", /*searchMe*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button0, "selected", /*$collPick*/ ctx[1] === 0);
    			}

    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button1, "selected", /*$collPick*/ ctx[1] === 1);
    			}

    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button2, "selected", /*$collPick*/ ctx[1] === 2);
    			}

    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button3, "selected", /*$collPick*/ ctx[1] === 3);
    			}

    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button4, "selected", /*$collPick*/ ctx[1] === 4);
    			}

    			if (dirty & /*$collPick*/ 2) {
    				toggle_class(button5, "selected", /*$collPick*/ ctx[1] === 5);
    			}

    			if (dirty & /*mySearch*/ 1 && input.value !== /*mySearch*/ ctx[0]) {
    				set_input_value(input, /*mySearch*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button5);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button6);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $selectedOption;
    	let $myData;
    	let $selectedIndex;
    	let $collPick;
    	let $API_URI;
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(12, $selectedOption = $$value));
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(13, $myData = $$value));
    	validate_store(selectedIndex, 'selectedIndex');
    	component_subscribe($$self, selectedIndex, $$value => $$invalidate(14, $selectedIndex = $$value));
    	validate_store(collPick, 'collPick');
    	component_subscribe($$self, collPick, $$value => $$invalidate(1, $collPick = $$value));
    	validate_store(API_URI, 'API_URI');
    	component_subscribe($$self, API_URI, $$value => $$invalidate(15, $API_URI = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavData', slots, []);

    	const refreshMe = async () => {
    		set_store_value(selectedIndex, $selectedIndex = 'none', $selectedIndex);
    		const res = await fetch($API_URI + '/old/' + $collPick);
    		set_store_value(myData, $myData = await res.json(), $myData);
    		console.log($myData);
    	};

    	const sortMe = () => {
    		// Assuming you have an array of objects called 'myCollection'
    		set_store_value(
    			myData,
    			$myData = $myData.sort((a, b) => {
    				const titleA = a.col_a.toUpperCase(); // Ignore case by converting to uppercase
    				const titleB = b.col_a.toUpperCase(); // Ignore case by converting to uppercase

    				// Compare the titles alphabetically
    				if (titleA < titleB) {
    					return -1; // If titleA comes before titleB, return a negative number
    				}

    				if (titleA > titleB) {
    					return 1; // If titleA comes after titleB, return a positive number
    				}

    				return 0; // If titles are equal, return 0
    			}),
    			$myData
    		);

    		set_store_value(selectedIndex, $selectedIndex = $myData.findIndex(item => item === $selectedOption), $selectedIndex);
    	}; //console.log( newIndex)

    	let mySearch = "";

    	// Assuming you have an array of objects called 'myCollection'
    	const searchMe = () => {
    		set_store_value(
    			myData,
    			$myData = $myData.filter(obj => {
    				const myKeyValue = obj.col_c.toLowerCase(); // Convert myKey value to lowercase for case-insensitive matching
    				const searchText = mySearch.toLowerCase(); // Convert searchText to lowercase for case-insensitive matching
    				return myKeyValue.includes(searchText);
    			}),
    			$myData
    		);

    		set_store_value(selectedIndex, $selectedIndex = $myData.findIndex(item => item === $selectedOption), $selectedIndex);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<NavData> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		set_store_value(collPick, $collPick = 0, $collPick);
    		refreshMe();
    	};

    	const click_handler_1 = () => {
    		set_store_value(collPick, $collPick = 1, $collPick);
    		refreshMe();
    	};

    	const click_handler_2 = () => {
    		set_store_value(collPick, $collPick = 2, $collPick);
    		refreshMe();
    	};

    	const click_handler_3 = () => {
    		set_store_value(collPick, $collPick = 3, $collPick);
    		refreshMe();
    	};

    	const click_handler_4 = () => {
    		set_store_value(collPick, $collPick = 4, $collPick);
    		refreshMe();
    	};

    	const click_handler_5 = () => {
    		set_store_value(collPick, $collPick = 5, $collPick);
    		refreshMe();
    	};

    	function input_input_handler() {
    		mySearch = this.value;
    		$$invalidate(0, mySearch);
    	}

    	$$self.$capture_state = () => ({
    		myData,
    		collPick,
    		API_URI,
    		selectedIndex,
    		selectedOption,
    		refreshMe,
    		sortMe,
    		mySearch,
    		searchMe,
    		$selectedOption,
    		$myData,
    		$selectedIndex,
    		$collPick,
    		$API_URI
    	});

    	$$self.$inject_state = $$props => {
    		if ('mySearch' in $$props) $$invalidate(0, mySearch = $$props.mySearch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mySearch,
    		$collPick,
    		refreshMe,
    		sortMe,
    		searchMe,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_input_handler
    	];
    }

    class NavData extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavData",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\StatePanel.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\StatePanel.svelte";

    // (4:48) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No Data");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(4:48) {:else}",
    		ctx
    	});

    	return block;
    }

    // (4:5) {#if $myData.length}
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = /*$myData*/ ctx[0].length + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("total: ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$myData*/ 1 && t1_value !== (t1_value = /*$myData*/ ctx[0].length + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(4:5) {#if $myData.length}",
    		ctx
    	});

    	return block;
    }

    // (4:128) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("selected: NONE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(4:128) {:else}",
    		ctx
    	});

    	return block;
    }

    // (4:70) {#if $selectedIndex != 'none' }
    function create_if_block$1(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("selected: ");
    			t1 = text(/*$selectedIndex*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selectedIndex*/ 2) set_data_dev(t1, /*$selectedIndex*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(4:70) {#if $selectedIndex != 'none' }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*$myData*/ ctx[0].length) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$selectedIndex*/ ctx[1] != 'none') return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t = text(" / ");
    			if_block1.c();
    			add_location(div, file$3, 3, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $myData;
    	let $selectedIndex;
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(0, $myData = $$value));
    	validate_store(selectedIndex, 'selectedIndex');
    	component_subscribe($$self, selectedIndex, $$value => $$invalidate(1, $selectedIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StatePanel', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StatePanel> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		myData,
    		collPick,
    		selectedIndex,
    		$myData,
    		$selectedIndex
    	});

    	return [$myData, $selectedIndex];
    }

    class StatePanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatePanel",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\AppGrid.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\AppGrid.svelte";

    function create_fragment$3(ctx) {
    	let getdata;
    	let t0;
    	let div11;
    	let div0;
    	let navdata;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let selecttitle;
    	let t3;
    	let div3;
    	let statepanel;
    	let t4;
    	let div4;
    	let t5;
    	let div5;
    	let viewtitle;
    	let t6;
    	let div6;
    	let t7;
    	let div7;
    	let viewdoc;
    	let t8;
    	let div8;
    	let t9;
    	let div9;
    	let t10;
    	let div10;
    	let deletebtn;
    	let t11;
    	let savebtn;
    	let current;
    	getdata = new GetData({ $$inline: true });
    	navdata = new NavData({ $$inline: true });
    	selecttitle = new SelectTitle3({ $$inline: true });
    	statepanel = new StatePanel({ $$inline: true });
    	viewtitle = new ViewTitle({ $$inline: true });
    	viewdoc = new ViewDoc({ $$inline: true });
    	deletebtn = new DeleteBtn({ $$inline: true });
    	savebtn = new SaveBtn({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(getdata.$$.fragment);
    			t0 = space();
    			div11 = element("div");
    			div0 = element("div");
    			create_component(navdata.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			create_component(selecttitle.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			create_component(statepanel.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			t5 = space();
    			div5 = element("div");
    			create_component(viewtitle.$$.fragment);
    			t6 = space();
    			div6 = element("div");
    			t7 = space();
    			div7 = element("div");
    			create_component(viewdoc.$$.fragment);
    			t8 = space();
    			div8 = element("div");
    			t9 = space();
    			div9 = element("div");
    			t10 = space();
    			div10 = element("div");
    			create_component(deletebtn.$$.fragment);
    			t11 = space();
    			create_component(savebtn.$$.fragment);
    			attr_dev(div0, "class", "a svelte-13jbqza");
    			add_location(div0, file$2, 15, 4, 446);
    			attr_dev(div1, "class", "b svelte-13jbqza");
    			add_location(div1, file$2, 16, 4, 484);
    			attr_dev(div2, "class", "c svelte-13jbqza");
    			add_location(div2, file$2, 17, 4, 511);
    			attr_dev(div3, "class", "d svelte-13jbqza");
    			add_location(div3, file$2, 21, 4, 569);
    			attr_dev(div4, "class", "e svelte-13jbqza");
    			add_location(div4, file$2, 23, 4, 612);
    			attr_dev(div5, "class", "f svelte-13jbqza");
    			add_location(div5, file$2, 24, 4, 639);
    			attr_dev(div6, "class", "g svelte-13jbqza");
    			add_location(div6, file$2, 25, 4, 679);
    			attr_dev(div7, "class", "h svelte-13jbqza");
    			add_location(div7, file$2, 26, 4, 706);
    			attr_dev(div8, "class", "i svelte-13jbqza");
    			add_location(div8, file$2, 29, 4, 761);
    			attr_dev(div9, "class", "j svelte-13jbqza");
    			add_location(div9, file$2, 30, 4, 788);
    			attr_dev(div10, "class", "k svelte-13jbqza");
    			add_location(div10, file$2, 32, 4, 817);
    			attr_dev(div11, "class", "container svelte-13jbqza");
    			add_location(div11, file$2, 14, 0, 417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(getdata, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div0);
    			mount_component(navdata, div0, null);
    			append_dev(div11, t1);
    			append_dev(div11, div1);
    			append_dev(div11, t2);
    			append_dev(div11, div2);
    			mount_component(selecttitle, div2, null);
    			append_dev(div11, t3);
    			append_dev(div11, div3);
    			mount_component(statepanel, div3, null);
    			append_dev(div11, t4);
    			append_dev(div11, div4);
    			append_dev(div11, t5);
    			append_dev(div11, div5);
    			mount_component(viewtitle, div5, null);
    			append_dev(div11, t6);
    			append_dev(div11, div6);
    			append_dev(div11, t7);
    			append_dev(div11, div7);
    			mount_component(viewdoc, div7, null);
    			append_dev(div11, t8);
    			append_dev(div11, div8);
    			append_dev(div11, t9);
    			append_dev(div11, div9);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			mount_component(deletebtn, div10, null);
    			append_dev(div10, t11);
    			mount_component(savebtn, div10, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(getdata.$$.fragment, local);
    			transition_in(navdata.$$.fragment, local);
    			transition_in(selecttitle.$$.fragment, local);
    			transition_in(statepanel.$$.fragment, local);
    			transition_in(viewtitle.$$.fragment, local);
    			transition_in(viewdoc.$$.fragment, local);
    			transition_in(deletebtn.$$.fragment, local);
    			transition_in(savebtn.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(getdata.$$.fragment, local);
    			transition_out(navdata.$$.fragment, local);
    			transition_out(selecttitle.$$.fragment, local);
    			transition_out(statepanel.$$.fragment, local);
    			transition_out(viewtitle.$$.fragment, local);
    			transition_out(viewdoc.$$.fragment, local);
    			transition_out(deletebtn.$$.fragment, local);
    			transition_out(savebtn.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(getdata, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div11);
    			destroy_component(navdata);
    			destroy_component(selecttitle);
    			destroy_component(statepanel);
    			destroy_component(viewtitle);
    			destroy_component(viewdoc);
    			destroy_component(deletebtn);
    			destroy_component(savebtn);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppGrid', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		GetData,
    		SelectTitle: SelectTitle3,
    		ViewTitle,
    		ViewDoc,
    		DeleteBtn,
    		SaveBtn,
    		NavData,
    		StatePanel
    	});

    	return [];
    }

    class AppGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppGrid",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\SelectTitle.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\SelectTitle.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (6:2) {#if $myData}
    function create_if_block(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*$myData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			select.multiple = "multiple";
    			attr_dev(select, "class", "svelte-1urd7mh");
    			if (/*$selectedOption*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$1, 6, 4, 108);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(select, null);
    				}
    			}

    			select_option(select, /*$selectedOption*/ ctx[1], true);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$myData*/ 1) {
    				each_value = /*$myData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$selectedOption, $myData*/ 3) {
    				select_option(select, /*$selectedOption*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(6:2) {#if $myData}",
    		ctx
    	});

    	return block;
    }

    // (8:6) {#each $myData as data}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*data*/ ctx[3].col_a + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*data*/ ctx[3];
    			option.value = option.__value;
    			add_location(option, file$1, 8, 8, 207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$myData*/ 1 && t_value !== (t_value = /*data*/ ctx[3].col_a + "")) set_data_dev(t, t_value);

    			if (dirty & /*$myData*/ 1 && option_value_value !== (option_value_value = /*data*/ ctx[3])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:6) {#each $myData as data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*$myData*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$myData*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $myData;
    	let $selectedOption;
    	validate_store(myData, 'myData');
    	component_subscribe($$self, myData, $$value => $$invalidate(0, $myData = $$value));
    	validate_store(selectedOption, 'selectedOption');
    	component_subscribe($$self, selectedOption, $$value => $$invalidate(1, $selectedOption = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelectTitle', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelectTitle> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		$selectedOption = select_value(this);
    		selectedOption.set($selectedOption);
    	}

    	$$self.$capture_state = () => ({
    		myData,
    		selectedOption,
    		$myData,
    		$selectedOption
    	});

    	return [$myData, $selectedOption, select_change_handler];
    }

    class SelectTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTitle",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\BradyBunch.svelte generated by Svelte v3.59.2 */
    const file = "src\\BradyBunch.svelte";

    function create_fragment$1(ctx) {
    	let div9;
    	let div0;
    	let selecttitle;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let getdata;
    	let t4;
    	let div5;
    	let t5;
    	let div6;
    	let t6;
    	let div7;
    	let t7;
    	let div8;
    	let viewdoc;
    	let current;
    	selecttitle = new SelectTitle({ $$inline: true });
    	getdata = new GetData({ $$inline: true });
    	viewdoc = new ViewDoc({ $$inline: true });

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			create_component(selecttitle.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			create_component(getdata.$$.fragment);
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			create_component(viewdoc.$$.fragment);
    			attr_dev(div0, "class", "a svelte-1jzic27");
    			add_location(div0, file, 8, 4, 194);
    			attr_dev(div1, "class", "b svelte-1jzic27");
    			add_location(div1, file, 9, 4, 236);
    			attr_dev(div2, "class", "c svelte-1jzic27");
    			add_location(div2, file, 10, 4, 263);
    			attr_dev(div3, "class", "d svelte-1jzic27");
    			add_location(div3, file, 11, 4, 290);
    			attr_dev(div4, "class", "e svelte-1jzic27");
    			add_location(div4, file, 12, 4, 317);
    			attr_dev(div5, "class", "f svelte-1jzic27");
    			add_location(div5, file, 13, 4, 355);
    			attr_dev(div6, "class", "g svelte-1jzic27");
    			add_location(div6, file, 14, 4, 382);
    			attr_dev(div7, "class", "h svelte-1jzic27");
    			add_location(div7, file, 15, 4, 409);
    			attr_dev(div8, "class", "i svelte-1jzic27");
    			add_location(div8, file, 16, 4, 436);
    			attr_dev(div9, "class", "container svelte-1jzic27");
    			add_location(div9, file, 7, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			mount_component(selecttitle, div0, null);
    			append_dev(div9, t0);
    			append_dev(div9, div1);
    			append_dev(div9, t1);
    			append_dev(div9, div2);
    			append_dev(div9, t2);
    			append_dev(div9, div3);
    			append_dev(div9, t3);
    			append_dev(div9, div4);
    			mount_component(getdata, div4, null);
    			append_dev(div9, t4);
    			append_dev(div9, div5);
    			append_dev(div9, t5);
    			append_dev(div9, div6);
    			append_dev(div9, t6);
    			append_dev(div9, div7);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    			mount_component(viewdoc, div8, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selecttitle.$$.fragment, local);
    			transition_in(getdata.$$.fragment, local);
    			transition_in(viewdoc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selecttitle.$$.fragment, local);
    			transition_out(getdata.$$.fragment, local);
    			transition_out(viewdoc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(selecttitle);
    			destroy_component(getdata);
    			destroy_component(viewdoc);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BradyBunch', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BradyBunch> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ GetData, SelectTitle, ViewDoc });
    	return [];
    }

    class BradyBunch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BradyBunch",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let appgrid;
    	let current;
    	appgrid = new AppGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(appgrid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(appgrid, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appgrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appgrid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ AppGrid, BradyBunch });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
