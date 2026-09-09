// Local, explicitly registered modules only. No remote plugin loading or code evaluation.
export function createAppHost(sharedOptions = {}) {
  const factories = new Map(), mounted = new Map();
  let disposed = false;
  function register(id, mount) {
    if (disposed) throw new Error('App host is disposed');
    if (!/^[a-z][a-z0-9-]*$/.test(id) || typeof mount !== 'function') throw new TypeError('Invalid app registration');
    if (factories.has(id)) throw new Error(`App already registered: ${id}`);
    factories.set(id, mount);
  }
  function unmount(id) {
    const instance = mounted.get(id);
    if (!instance) return;
    mounted.delete(id); // Remove ownership first, even if cleanup throws.
    try { instance.handle.destroy(); } finally { instance.host.replaceChildren(); }
  }
  function mount(id, host, initialState) {
    if (disposed) throw new Error('App host is disposed');
    if (!factories.has(id)) throw new Error(`Unknown app: ${id}`);
    if (!host || typeof host.replaceChildren !== 'function') throw new TypeError('An app content host is required');
    unmount(id);
    let handle;
    try {
      handle = factories.get(id)(host, {...sharedOptions, initialState});
      if (!handle || typeof handle.destroy !== 'function') throw new TypeError('App must return destroy()');
    } catch (error) {
      host.replaceChildren();
      throw error;
    }
    mounted.set(id, {host, handle});
    return handle;
  }
  return Object.freeze({register, mount, unmount,
    has: id => factories.has(id),
    getState: id => mounted.get(id)?.handle.getState?.(),
    destroy() {
      if (disposed) return;
      disposed = true;
      const errors=[];
      for (const id of [...mounted.keys()]) { try { unmount(id); } catch(error) { errors.push(error); } }
      factories.clear();
      if (errors.length) throw new AggregateError(errors,'App cleanup failed');
    }
  });
}
