const whitelist = [process.env.URL_CORS_ORIGIN];


const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean | undefined) => void) {

    if (origin) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }

  }
};

export default corsOptions;
