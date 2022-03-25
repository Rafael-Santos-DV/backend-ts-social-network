const whitelist = [String(process.env.URL_CORS_ORIGIN)];


const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean | undefined) => void) {

    if (origin) {
      console.log(origin);
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(origin);
        callback(new Error('Not allowed by CORS'));
      }
    }

  }
};

export default corsOptions;
