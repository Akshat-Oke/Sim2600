import pickle

of = open("../chips/net_6502.pkl", "rb")
obj = pickle.load(of)
of.close()
