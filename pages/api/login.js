export default function handler(req, res) {
  return res.status(200).json({
    debug: "VERSÃO DO GITHUB ATUALIZOU"
  });
}
