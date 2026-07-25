import { createConsoleLogger } from './consoleLogger';

describe('createConsoleLogger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info messages via console.info', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const logger = createConsoleLogger();

    logger.info('hello', { foo: 'bar' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('hello'),
      expect.objectContaining({ foo: 'bar' }),
    );
  });

  it('formats Error instances with a stack trace', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createConsoleLogger();

    logger.error(new Error('boom'));

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('boom'),
      expect.anything(),
    );
  });

  it('attaches the current user id to subsequent log context after setUser', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = createConsoleLogger();

    logger.setUser({ id: 'user-123' });
    logger.warn('careful');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('careful'),
      expect.objectContaining({ userId: 'user-123' }),
    );
  });

  it('stops attaching a user id after setUser(null)', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = createConsoleLogger();

    logger.setUser({ id: 'user-123' });
    logger.setUser(null);
    logger.debug('quiet');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('quiet'), '');
  });
});
